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
        console.log('loaded openlink strophe library');
    },

    statusChanged: function(status, condition) {
        var self = this;
        if (status == Strophe.Status.CONNECTED) {
            this.callHandlerId = this._connection.addHandler(function(packet) {
                var callsElem = packet.getElementsByTagName('callstatus')[0];
                if (callsElem) {
                    var queryCall = callsElem.getElementsByTagName('call');
                    for (var _i = 0, _len = queryCall.length; _i < _len; _i++) {
                        console.log(queryCall[_i]);
                        var data = self._parseCallInterest(queryCall[_i]);
                        self._updateCalls(data);
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
     * Implements 'http://xmpp.org/......'.
     * Get Private Storage
     */
    getPrivateData: function (successCallback) {
        var gp_iq = $iq({
            type : "get",
            id: "gtx-data1"
        }).c("query", {
            xmlns : "jabber:iq:private"
        }).c("gtx-profile", {
            xmlns: "http://gltd.net/protocol/gtx/profile"
        });

        var self = this;
        var _successCallback = function(iq) {
            if (successCallback) {
                successCallback(iq);
            } else {
                console.log("Success", iq);
            }
        };

        var _errorCallback = function(iq) {
            console.log("Error", iq);
        };

        this._connection.sendIQ(gp_iq, _successCallback, _errorCallback);
    },

    /**
     * Implements 'http://xmpp.org/extensions/xep-0030.html'.
     * Disco Items
     */
    discoItems: function (to, successCallback) {
        var gp_iq = $iq({
            to : to,
            type : "get",
            id: "items1",
            from: Strophe.getBareJidFromJid(this._connection.jid)
        }).c("query", {
            xmlns : "http://jabber.org/protocol/disco#items"
        });

        var self = this;
        var _successCallback = function(iq) {
            if (successCallback) {
                successCallback(iq);
            } else {
                console.log("Success", iq);
            }
        };

        var _errorCallback = function(iq) {
            console.log("Error", iq);
        };

        this._connection.sendIQ(gp_iq, _successCallback, _errorCallback);
    },

    discoInfo: function (jid, successCallback) {
        var gp_iq = $iq({
            to : jid,
            type : "get",
            id: "info-" + jid,
            from: Strophe.getBareJidFromJid(this._connection.jid)
        }).c("query", {
            xmlns : "http://jabber.org/protocol/disco#info"
        });

        var self = this;
        var _successCallback = function(iq) {
            if (successCallback) {
                successCallback(iq);
            } else {
                console.log(iq);
            }
        };

        var _errorCallback = function(iq) {
            console.log("Error", iq);
        };

        this._connection.sendIQ(gp_iq, _successCallback, _errorCallback);
    },

    /**
     * Implements 'http://xmpp.org/protocol/openlink:01:00:00#get-profiles'.
     * @param to Openlink XMPP component.
     * @param successCallback called on successful execution with array of profile IDs and profiles.
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
            if (errorCallback && self._isError(iq)) {
                errorCallback(self._getErrorNote(iq));
                return;
            }

            var query = iq.getElementsByTagName('profile');
            for (var _i = 0, _len = query.length; _i < _len; _i++) {
                var data = self._parseProfile(query[_i]);
                var profile = new Profile(data);
                for (var _j = 0, _len1 = data.actions.length; _j < _len1; _j++) {
                    profile._addAction(data.actions[_j]);
                }

                self.profiles[profile.id] = profile;
            }
            if (successCallback) {
                successCallback(self.profiles);
            }
        };

        var _errorCallback = function(iq) {
            if (errorCallback) {
                errorCallback('Error getting profiles');
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
            if (errorCallback && self._isError(iq)) {
                errorCallback(self._getErrorNote(iq));
                return;
            }

            var interestsElem = iq.getElementsByTagName('interests')[0];
            var callsElem = iq.getElementsByTagName('callstatus')[0];
            if (interests) {
                var query = interestsElem.getElementsByTagName('interest');
                for (var _i = 0, _len = query.length; _i < _len; _i++) {
                    var data = self._parseAttributes(query[_i]);
                    if (data.id) {
                        var interest = new Interest(data);
                        interests[interest.id] = interest;
                    }
                }
                if (callsElem) {
                    var queryCall = callsElem.getElementsByTagName('call');
                    for (var _i = 0, _len = queryCall.length; _i < _len; _i++) {
                        console.log(queryCall[_i]);
                        var data = self._parseCallInterest(queryCall[_i]);
                        self._updateCalls(data);
                    }
                }
                if (successCallback) {
                    successCallback(interests);
                }
            }
        };

        var _errorCallback = function(iq) {
            if (errorCallback) {
                errorCallback('Error getting interests')
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
            if (errorCallback && self._isError(iq)) {
                errorCallback(self._getErrorNote(iq));
                return;
            }

            var query = iq.getElementsByTagName('feature');
            for (var _i = 0, _len = query.length; _i < _len; _i++) {
                var data = self._parseAttributes(query[_i]);
                var feature = new Feature(data);
                features[feature.id] = feature;
            }
            console.log("FEATURES:", features);
            if (successCallback) {
                successCallback(features);
            }
        };

        var _errorCallback = function(iq) {
            if (errorCallback) {
                errorCallback('Error getting features');
            }
        };

        this._connection.sendIQ(gf_iq, _successCallback, _errorCallback);
    },

    /**
     * Implements 'http://xmpp.org/protocol/openlink:01:00:00#get-call-history'.
     * @param to Openlink XMPP component.
     * @param successCallback called on successful execution.
     * @param errorCallback called on error.
     */
    getCallHistory: function(to, jid, profile, caller, called, calltype, fromdate, uptodate, start, count, successCallback, errorCallback) {
        var history = {};
        var self = this;
        var gf_iq = $iq({
            to : to,
            type : "set"
        }).c("command", {
            xmlns : "http://jabber.org/protocol/commands",
            action : "execute",
            node : "http://xmpp.org/protocol/openlink:01:00:00#get-call-history"
        }).c("iodata", {
            xmlns : "urn:xmpp:tmp:io-data",
            type : "input"
        }).c("in")
        .c("jid").t(Strophe.getBareJidFromJid(self._connection.jid)).up()
        .c("profile").t(profile).up()
        .c("caller").t(caller).up()
        .c("called").t(called).up()
        .c("calltype").t(calltype).up()
        .c("fromdate").t(fromdate).up()
        .c("uptodate").t(uptodate).up()
        .c("start").t(start).up()
        .c("count").t(count).up();
        
        var _successCallback = function(iq) {
            if (errorCallback && self._isError(iq)) {
                errorCallback(self._getErrorNote(iq));
                return;
            }

            var query = iq.getElementsByTagName('call');
            for (var _i = 0, _len = query.length; _i < _len; _i++) {
                var data = self._parseCallHistory(query[_i]);
                history[data.id] = data;
            }
            console.log("HISTORY:", history);
            if (successCallback) {
                successCallback(history);
            }
        };

        var _errorCallback = function(iq) {
            if (errorCallback) {
                errorCallback('Error getting history');
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
                errorCallback('Already subscribed with ' + subscriptions.length + ' subscriptions');
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
                    if (successCallback) {
                        successCallback('Subscribed');
                    }
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
                        if (successCallback) {
                            successCallback('Unsubscribed');
                        }
                    });
                }
            } else {
                if (errorCallback) {
                    errorCallback('No subscriptions exist');
                }
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
                var data = self._parseAttributes(query[_i]);
                subscriptions.push(data);
            }
            if (successCallback) {
                successCallback(subscriptions);
            }
        };

        var _errorCallback = function(iq) {
            if (errorCallback) {
                errorCallback('Error getting subscriptions');
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
     * @param successCallback called on successful execution with new call object.
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
            .c("destination").t(extension);

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
        var _successCallback = function(iq) {
            if (errorCallback && self._isError(iq)) {
                errorCallback(self._getErrorNote(iq));
                return;
            }

            var call = self._parseCall(iq);
            if (successCallback) {
                successCallback(call);
            }
        };

        var _errorCallback = function(iq) {
            if (errorCallback) {
                errorCallback('Error on make call');
            }
        };

        this._connection.sendIQ(mc_iq, _successCallback, _errorCallback);
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
            from : Strophe.getBareJidFromJid(this._connection.jid),
            type : "set"
        }).c("command", {
            xmlns : "http://jabber.org/protocol/commands",
            action : "execute",
            node : "http://xmpp.org/protocol/openlink:01:00:00#request-action"
        }).c("iodata", {
            xmlns : "urn:xmpp:tmp:io-data",
            type : "input"
        }).c("in")
        .c("interest").t(interest).up()
        .c("action").t(action.id).up()
        .c("call").t(callId).up();
        if (action.value1) {
            mc_iq = mc_iq.c("value1").t(action.value1).up();
        }
        if (action.value2) {
            mc_iq = mc_iq.c("value2").t(action.value2).up();
        }

        var self = this;
        var _successCallback = function(iq) {
            if (errorCallback && self._isError(iq)) {
                errorCallback(self._getErrorNote(iq));
                return;
            }
            var call = self._parseCall(iq);
            if (successCallback) {
                successCallback(call);
            }
        }
        var _errorCallback = function(iq) {
            if (errorCallback) {
                errorCallback('Error on request action');
            }
        };

        this._connection.sendIQ(mc_iq, _successCallback, _errorCallback);
    },

    _updateCalls: function(callEv) {
        console.log("CALLS UPDATED");
        if (callEv) {
            var id = callEv.id;
            if (id) {
                this.calls[id] = callEv;
                var changed = callEv.changed;

                // notify call handlers here
                for (var handler in this.callHandlers) {
                    this.callHandlers[handler](callEv, changed);
                }

                if (callEv.state === 'ConnectionCleared' || callEv.state === 'CallMissed') {
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

    _parseCallHistory: function(elem) {
        var data = {};
        if (elem) {
            for (var _i = 0; _i < elem.childNodes.length; _i++) {
                data[elem.childNodes[_i].nodeName] = elem.childNodes[_i].textContent;
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

    _parseCall: function(elem) {
        var call = null;
        if (elem) {
            var callStatus = elem.getElementsByTagName('callstatus')[0];
            if (callStatus) {
                var callElem = callStatus.getElementsByTagName('call')[0];
                    if (callElem) {
                        var id = this._getElementText('id', callElem);
                        var call = new Call({id: id});

                        call.ref = this._flattenElementAndText(callElem.getElementsByTagName('originator-ref')[0]);

                        call.profile = this._getElementText('profile', callElem);
                        call.interest = this._getElementText('interest', callElem);
                        call.changed = this._getElementText('changed', callElem);
                        call.state = this._getElementText('state', callElem);

                        call.direction = this._getElementText('direction', callElem);
                        call.duration = this._getElementText('duration', callElem);

                        call.caller = this._flattenElementAndText(callElem.getElementsByTagName('caller')[0]);

                        call.called = this._flattenElementAndText(callElem.getElementsByTagName('called')[0]);

                        call.actions = this._parseCallActions(callElem.getElementsByTagName('actions')[0]);

                        call.participants = this._parseCallParticipants(callElem.getElementsByTagName('participants')[0]);
                        call.features = this._parseCallFeatures(callElem.getElementsByTagName('features')[0]);
                    }
            }
        }
        return call;
    },

    _parseCallInterest: function(elem) {
        var call = null;
        if (elem) {
            var callElem = elem;
            var id = this._getElementText('id', callElem);
            var call = new Call({id: id});

            call.ref = this._flattenElementAndText(callElem.getElementsByTagName('originator-ref')[0]);

            call.profile = this._getElementText('profile', callElem);
            call.interest = this._getElementText('interest', callElem);
            call.changed = this._getElementText('changed', callElem);
            call.state = this._getElementText('state', callElem);

            call.direction = this._getElementText('direction', callElem);
            call.duration = this._getElementText('duration', callElem);

            call.caller = this._flattenElementAndText(callElem.getElementsByTagName('caller')[0]);

            call.called = this._flattenElementAndText(callElem.getElementsByTagName('called')[0]);

            call.actions = this._parseCallActions(callElem.getElementsByTagName('actions')[0]);

            call.participants = this._parseCallParticipants(callElem.getElementsByTagName('participants')[0]);
            call.features = this._parseCallFeatures(callElem.getElementsByTagName('features')[0]);
        }
        return call;
    },

    _getErrorNote: function(elem) {
        var errorNpte = '';
        if (elem) {
            var foundElem = elem.getElementsByTagName('note')[0];
            if (foundElem) {
                if (foundElem.attributes.type && foundElem.attributes.type.value == 'error') {
                    if (foundElem.textContent && foundElem.textContent.length > 0)
                        errorNote = foundElem.textContent;
                }
            }
        }
        return errorNote;
    },

    _isError: function(elem) {
        var error = false;
        if (elem) {
            var foundElem = elem.getElementsByTagName('note')[0];
            if (foundElem) {
                if (foundElem.attributes.type && foundElem.attributes.type.value == 'error') {
                    if (foundElem.textContent && foundElem.textContent.length > 0)
                        console.error(foundElem.textContent);
                        error = true;
                    }
                }
            }
            else if (elem.attribute.type == 'error') {
                error = true;
            }
        return error;
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