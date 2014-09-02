/**
 * File: strophe.openlink.js
 * A Strophe plugin for Openlink.
 * http://openlink.4ng.net:8080/openlink/xep-xxx-openlink_15-11.xml
 */
Strophe.addConnectionPlugin('openlink', {

    _connection: null,

    profiles: {},
    calls: {},
    callHandlers: {},

    init: function (connection) {
        this._connection = connection;
    },

    statusChanged: function(status, condition) {
        var self = this;
        if (status == Strophe.Status.CONNECTED) {
            this.callHandlerId = this._connection.addHandler(function(packet) {
                console.log("PACKET: " + packet);
                var callStatus = packet.getElementsByTagName('callstatus')[0];
                if (callStatus) {
                    var callElem = callStatus.getElementsByTagName('call')[0];
                    if (callElem) {
                        var id = self._getElementText('id', callElem);
                        var callEv = new Call({id: id});

                        callEv.profile = self._getElementText('profile', callElem);
                        callEv.interest = self._getElementText('interest', callElem);
                        callEv.changed = self._getElementText('changed', callElem);
                        callEv.state = self._getElementText('state', callElem);

                        callEv.direction = self._getElementText('direction', callElem);
                        callEv.duration = self._getElementText('duration', callElem);

                        callEv.caller = self._flattenElementAndText(callElem.getElementsByTagName('caller')[0]);

                        callEv.called = self._flattenElementAndText(callElem.getElementsByTagName('called')[0]);

                        callEv.actions = self._parseCallActions(callElem.getElementsByTagName('actions')[0]);

                        callEv.participants = self._parseCallParticipants(callElem.getElementsByTagName('participants')[0]);
                        callEv.features = self._parseCallFeatures(callElem.getElementsByTagName('features')[0]);

                        self._updateCalls(callEv);
                    }
                }
                return true;
            }, null, 'message', null, null, this.getPubsubAddress());
        } else if (status == Strophe.Status.DISCONNECTED) {
            this._connection.removeHandler(this.callHandlerId);
        }
    },

    /**
     * Call this on startup to notify the server that the app is ready to receive events.
     */
    sendPresence: function() {
        this._connection.send($pres());
    },

    /**
     * Implements 'http://xmpp.org/protocol/openlink:01:00:00#get-profiles'.
     * @param to Openlink XMPP component.
     * @param successCallback called on successful execution.
     * @param errorCallback called on error.
     */
    getProfiles: function (to, successCallback, errorCallback) {
        var gp_iq = $iq({
            to : to,
            type : "set"
        }).c("command", {
            xmlns : "http://jabber.org/protocol/commands",
            action : "execute",
            node : "http://xmpp.org/protocol/openlink:01:00:00#get-profiles"
        }).c("iodata", {
            xmlns : "urn:xmpp:tmp:io-data",
            type : "input"
        }).c("in").c("jid").t(Strophe.getBareJidFromJid(this._connection.jid));

        var self = this;
        var _successCallback = function(iq) {
            var query = iq.getElementsByTagName('profile');
            for (var _i = 0, _len = query.length; _i < _len; _i++) {
                console.log('Profile: ',_i);
                var data = self._parseProfile(query[_i]);
                var profile = new Profile(data);
                for (var _j = 0, _len1 = data.actions.length; _j < _len1; _j++) {
                    profile._addAction(data.actions[_j]);
                }

                self.profiles[profile.id] = profile;
                console.log("data:",data);
            }
            console.log("PROFILES:", self.profiles);
            if (successCallback) {
                successCallback(self.profiles);
            }
        };

        var _errorCallback = function(iq) {
            console.error('Error calling getProfiles');
            if (errorCallback) {
                errorCallback('Error calling getProfiles');
            }
        };

        this._connection.sendIQ(gp_iq, _successCallback, _errorCallback);
    },

    /**
     * Implements 'http://xmpp.org/protocol/openlink:01:00:00#get-interest'.
     * @param to Openlink XMPP component.
     * @param profileId profile ID.
     * @param successCallback called on successful execution.
     * @param errorCallback called on error.
     */
    getInterests: function(to, profileId, successCallback, errorCallback) {
        var interests = {};
        var gi_iq = $iq({
            to : to,
            type : "set"
        }).c("command", {
            xmlns : "http://jabber.org/protocol/commands",
            action : "execute",
            node : "http://xmpp.org/protocol/openlink:01:00:00#get-interests"
        }).c("iodata", {
            xmlns : "urn:xmpp:tmp:io-data",
            type : "input"
        }).c("in").c("profile").t(profileId);

        var self = this;
        var _successCallback = function(iq) {
            var query = iq.getElementsByTagName('interest');

            for (var _i = 0, _len = query.length; _i < _len; _i++) {
                console.log('Interest: ',_i);
                var data = self._parseAttributes(query[_i]);
                var interest = new Interest(data);
                console.log("INTERESTDATA:",data);
                interests[interest.id] = interest;
            }
            console.log("INTERESTS:", interests);
            if (successCallback) {
                successCallback(interests);
            }
        };

        var _errorCallback = function(iq) {
            console.error('Error calling getInterests');
            if (errorCallback) {
                errorCallback('Error calling getInterests');
            }
        };

        this._connection.sendIQ(gi_iq, _successCallback, _errorCallback);
    },

    /**
     * Implements 'http://xmpp.org/protocol/openlink:01:00:00#get-features'.
     * @param to Openlink XMPP component.
     * @param profileId profile ID.
     * @param successCallback called on successful execution.
     * @param errorCallback called on error.
     */
    getFeatures: function(to, profileId, successCallback, errorCallback) {
        var features = {};
        var gf_iq = $iq({
            to : to,
            type : "set"
        }).c("command", {
            xmlns : "http://jabber.org/protocol/commands",
            action : "execute",
            node : "http://xmpp.org/protocol/openlink:01:00:00#get-features"
        }).c("iodata", {
            xmlns : "urn:xmpp:tmp:io-data",
            type : "input"
        }).c("in").c("profile").t(profileId);

        var self = this;
        var _successCallback = function(iq) {
            var query = iq.getElementsByTagName('feature');

            for (var _i = 0, _len = query.length; _i < _len; _i++) {
                console.log('Feature: ',_i);
                var data = self._parseAttributes(query[_i]);
                var feature = new Feature(data);
                console.log("FEATUREDATA:",data);
                features[feature.id] = feature;
            }
            console.log("FEATURES:", features);
            if (successCallback) {
                successCallback(features);
            }
        };

        var _errorCallback = function(iq) {
            console.error('Error calling getInterests');
            if (errorCallback) {
                errorCallback('Error calling getInterests');
            }
        };

        this._connection.sendIQ(gf_iq, _successCallback, _errorCallback);
    },

    /**
     * Implements 'http://www.xmpp.org/extensions/xep-0060.html#subscriber-subscribe'.
     * @param to pubsub service, usually pubsub.domain - see getPubsubAddress().
     * @param interest the Openlink interest/pubsub node.
     * @param successCallback called on successful execution.
     * @param errorCallback called on error.
     */
    subscribe: function(to, interest, successCallback, errorCallback) {
        var self = this;
        this.getSubscriptions(to, interest, function(subscriptions) {
            if (subscriptions.length > 0) {
                alert('Already subscribed with ' + subscriptions.length + ' subscriptions');
            } else {
                var subs_iq2 = $iq({
                    to: to,
                    type: "set"
                }).c('pubsub', {
                    xmlns: "http://jabber.org/protocol/pubsub"
                }).c('subscribe', {
                    node: interest,
                    jid: Strophe.getBareJidFromJid(self._connection.jid)
                });
                self._connection.sendIQ(subs_iq2, function(iq) {
                    alert('Subscribed');
                });
            }
        });
    },

    /**
     * Implements 'http://www.xmpp.org/extensions/xep-0060.html#subscriber-unsubscribe'.
     * @param to pubsub service, usually pubsub.domain - see getPubsubAddress().
     * @param interest the Openlink interest/pubsub node.
     * @param successCallback called on successful execution.
     * @param errorCallback called on error.
     */
    unsubscribe: function(to, interest, subscriptionId, successCallback, errorCallback) {
        var self = this;
        this.getSubscriptions(to, interest, function(subscriptions) {
            if (subscriptions.length > 0) {
                for (var _i = 0, _len = subscriptions.length; _i < _len; _i++) {
                    var subs_iq = $iq({
                        to: to,
                        type: "set"
                    }).c('pubsub', {
                        xmlns: "http://jabber.org/protocol/pubsub"
                    }).c('unsubscribe', {
                        node: interest,
                        jid: Strophe.getBareJidFromJid(self._connection.jid),
                        subid: subscriptions[_i].subid
                    });

                    self._connection.sendIQ(subs_iq, function (iq) {
                        alert('Unsubscribed');
                    });
                }
            } else {
                alert('No subscriptions exist');
            }
        });
    },

    /**
     * Implements 'http://www.xmpp.org/extensions/xep-0060.html#entity-subscriptions'.
     * @param to pubsub service, usually pubsub.domain - see getPubsubAddress().
     * @param interest the Openlink interest/pubsub node.
     * @param successCallback called on successful execution with list of subscriptions.
     * @param errorCallback called on error.
     */
    getSubscriptions: function(to, interest, successCallback, errorCallback) {
        var subscriptions = [];
        var subs_iq = $iq({
            to: to,
            type: "get"
        }).c('pubsub', {
            xmlns: "http://jabber.org/protocol/pubsub"
        }).c('subscriptions', {
            node: interest
        });

        var self = this;
        var _successCallback = function(iq) {
            var query = iq.getElementsByTagName('subscription');

            for (var _i = 0, _len = query.length; _i < _len; _i++) {
                console.log('Subscription: ',_i);
                var data = self._parseAttributes(query[_i]);
                console.log("SUBSCRIPTIONDATA:",data);
                subscriptions.push(data);
            }
            console.log("SUBSCRIPTIONS:", subscriptions);
            if (successCallback) {
                successCallback(subscriptions);
            }
        };

        var _errorCallback = function(iq) {
            console.error('Error calling getSubscriptions');
            if (errorCallback) {
                errorCallback('Error calling getSubscriptions');
            }
        };

        this._connection.sendIQ(subs_iq, _successCallback, _errorCallback);
    },

    /**
     * Returns the default pubsub address on the XMPP servers (tested on Openfire).
     * @returns {string} pubsub component address.
     */
    getPubsubAddress: function() {
        return 'pubsub.' + this._connection.domain;
    },

    /**
     * Implements 'http://xmpp.org/protocol/openlink:01:00:00#make-call'.
     * @param to Openlink XMPP component.
     * @param interest the Openlink interest.
     * @param extension the far party extension.
     * @param features array of call features in the form Feature.id, Feature.value1 and Feature.value2.
     * @param successCallback called on successful execution.
     * @param errorCallback called on error.
     */
    makeCall: function(to, interest, extension, features, successCallback, errorCallback) {
        console.log("Make call to: " + extension + ", callback: " + interest);

        var mc_iq = $iq({
            to : to,
            type : "set"
        }).c("command", {
            xmlns : "http://jabber.org/protocol/commands",
            action : "execute",
            node : "http://xmpp.org/protocol/openlink:01:00:00#make-call"
        }).c("iodata", {
            xmlns : "urn:xmpp:tmp:io-data",
            type : "input"
        }).c("in")
            .c("jid").t(Strophe.getBareJidFromJid(this._connection.jid)).up()
            .c("interest").t(interest).up()
            .c("destination").t(extension).up();

        if (features && features.length > 0) {
            mc_iq = mc_iq.up().c("features");
            for (var _i = 0, _len = features.length; _i < _len; _i++) {
                mc_iq = mc_iq.c("feature").c("id").t(features[_i].id).up()
                    .c("value1").t(features[_i].value1).up();
                if (features[_i].value2) {
                    mc_iq = mc_iq.c("value2").t(features[_i].value2).up();
                }
                mc_iq.up();
            }
        }

        var self = this;
        this._connection.sendIQ(mc_iq, function(iq) {

            // update successCallback on updated call

            // otherwise send error to errorCallback

//            if (!Openlink.checkError(iq)) {
//                console.log("MakeCall ID: " + callId);
//                console.log("MakeCall State: " + callState);
//                console.log("MakeCall Actions: " + callactions);
//                VoiceBlast.vent.trigger("alert", "warning", "Dialling " + Openlink.defaultInterest);
//            }
//            if (callstatus.length) {
//                console.log(callstatus);
//            } else {
//                console.log(callstatus)
//                return false;
//            }
//            var date = new Date();
//            var timestamp_date = convertTimestampToDate(date);


        });
    },

    /**
     * Implements 'http://xmpp.org/protocol/openlink:01:00:00#request-action'.
     * @param to Openlink XMPP component.
     * @param interest the Openlink interest.
     * @param action the Openlink action in the form Action.id, Action.value1, Action.value2.
     * @param successCallback called on successful execution.
     * @param errorCallback called on error.
     */
    requestAction: function(to, interest, callId, action, successCallback, errorCallback) {
        var mc_iq = $iq({
            to : to,
            type : "set"
        }).c("command", {
            xmlns : "http://jabber.org/protocol/commands",
            action : "execute",
            node : "http://xmpp.org/protocol/openlink:01:00:00#request-action"
        }).c("iodata", {
            xmlns : "urn:xmpp:tmp:io-data",
            type : "input"
        }).c("in").c("interest").t(interest).up().c("action").t(action.id).up().c("call").t(callId).up();
        if (action.value1) {
            mc_iq = mc_iq.c("value1").t(action.value1).up();
        }
        if (action.value2) {
            mc_iq = mc_iq.c("value2").t(action.value2).up();
        }
        this._connection.sendIQ(mc_iq, function(iq) {
//            if (!Openlink.checkError(iq)) {
//                VoiceBlast.vent.trigger("alert", "warning", "Joining Call " + callid);
//            }
        });
    },

    _updateCalls: function(callEv) {
        if (callEv) {
            var id = callEv.id;
            if (id) {
                this.calls[id] = callEv;
                var changed = callEv.changed;

                // notify call handlers here
                for (var handler in this.callHandlers) {
                    this.callHandlers[handler](callEv, changed);
                }

                if (callEv.state === 'ConnectionCleared') {
                    delete this.calls[id];
                }
            }
        }
    },

    _getUid: function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    },

    /**
     * Adds a call handler which is notified on any call event with the parameters: Call Event and Changed Element.
     * @param handler
     * @returns {*} the id associated with the handler. Retain this in order to remove the handler.
     */
    addCallHandler: function(handler) {
        var id = this._getUid();
        this.callHandlers[id] = handler;
        return id;
    },

    /**
     * Removes the call handler.
     * @param id the call handler id.
     * @returns {boolean}
     */
    removeHandler: function(id) {
        return delete this.callHandlers[id];
    },

    /* Parser Helpers */
    _parseProfile: function(profile) {
        var data = {};
        data.actions = [];
        if (profile) {
            var a = profile.attributes;
            if (a) {
                if (a.id && a.device) {
                    for (var _i = 0, _len = a.length; _i < _len; _i++) {
                        data[a[_i].name] = a[_i].value;
                    }
                    var query = profile.getElementsByTagName('action');
                    for (var _j = 0, _len1 = query.length; _j < _len1; _j++) {
                        var action = this._parseAttributes(query[_j]);
                        data.actions.push(action);
                    }
                }
            }
        }
        return data;
    },

    _parseAttributes: function(elem) {
        var data = {};
        if (elem) {
            var a = elem.attributes;
            if (a) {
                for (var _i = 0, _len = a.length; _i < _len; _i++) {
                    data[a[_i].name] = a[_i].value;
                }
            }
        }
        return data;
    },

    _flattenElementAndText: function(elem) {
        var data = {};
        if (elem) {
            for (var _i = 0; _i < elem.childNodes.length; _i++) {
                data[elem.childNodes[_i].tagName] = elem.childNodes[_i].textContent;
            }
        }
        return data;
    },

    _parseCallParticipants: function(elem) {
        var data = [];
        if (elem) {
            for (var _i = 0; _i < elem.childNodes.length; _i++) {
                data.push(this._parseAttributes(elem.childNodes[_i]));
            }
        }
        return data;
    },

    _parseCallFeatures: function(elem) {
        var data = {};
        if (elem) {
            for (var _i = 0; _i < elem.childNodes.length; _i++) {
                data[elem.childNodes[_i].attributes.id.value] = elem.childNodes[_i].textContent;
            }
        }
        return data;
    },

    _parseCallActions: function(elem) {
        var data = [];
        if (elem) {
            for (var _i = 0; _i < elem.childNodes.length; _i++) {
                data.push(elem.childNodes[_i].tagName);
            }
        }
        return data;
    },

    _getElementText: function(name, elem) {
        var result;
        if (name && elem) {
            var foundElem = elem.getElementsByTagName(name)[0];
            if (foundElem) {
                result = foundElem.textContent;
            }
        }
        return result;
    },

    _isError: function(elem) {
//        var result = false;
//        if (elem) {
//            if (elem.type === 'error') {
//                result = true;
//            }
//            else
//            {
//                var query = elem.getElementsByTagName('error');
//                if (query && query.length != 0) {
//                    result = true;
//                }
//            }
//        }
//       return result;
    },

    _checkError : function(elem) {
//        if (elem) {
//            var errorNote = $(elem).find('note[type="error"]').text();
//            if (errorNote != null && errorNote != '') {
//                console.log("Openlink ERROR >>> " + errorNote);
//                if (errorNote.indexOf("Invalid interest") >= 0) {
//                    VoiceBlast.vent.trigger("alert", "error", "Please wait while your account is being provisioned for voice, this can take up to 60 seconds...");
//                } else {
//                    VoiceBlast.vent.trigger("alert", "error", errorNote);
//                }
//                return true;
//            }
//        }
//        return false;
    }

});

function Profile(data) {
    this.actions = {};
    this.interests = {};
    for (var elem in data) {
        this[elem] = data[elem];
    }
}

Profile.prototype._addAction = function(data) {
    var action = new Action(data);
    this.actions[action.id] = action;
    return action;
};

Profile.prototype._addInterest = function(data) {
    var interest = new Interest(data);
    this.interests[interest.id] = interest;
    return interest;
};

function Action(data) {
    for (var elem in data) {
        this[elem] = data[elem];
    }
}

function Interest(data) {
    for (var elem in data) {
        this[elem] = data[elem];
    }
}

function Feature(data) {
    for (var elem in data) {
        this[elem] = data[elem];
    }
}

function Call(data, caller, called, actions, participants, features) {
    this.id = data.id;
    this.profile = data.profile;
    this.interest = data.interest;
    this.changed = data.changed;
    this.state = data.state;
    this.direction = data.direction;
    this.duration = data.duration;
    this.caller = caller;
    this.called = called;
    this.actions = actions;
    this.participants = participants;
    this.features = features;
}

Call.prototype._update = function(data, caller, called, actions, participants, features) {
    this.profile = data.profile;
    this.interest = data.interest;
    this.changed = data.changed;
    this.state = data.state;
    this.direction = data.direction;
    this.duration = data.duration;
    this.caller = caller;
    this.called = called;
    this.actions = actions;
    this.participants = participants;
    this.features = features;
}

