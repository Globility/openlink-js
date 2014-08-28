/**
 * File: strophe.openlink.js
 * A Strophe plugin for Openlink.
 * http://openlink.4ng.net:8080/openlink/xep-xxx-openlink_15-11.xml
 */
Strophe.addConnectionPlugin('openlink', {

    _connection: null,
    profiles: {},

    init: function (connection) {
        this._connection = connection;
    },


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

    _isError: function(packet) {
        var result = false;
        if (packet) {
            if (packet.type === 'error') {
                result = true;
            }
            else
            {
                var query = packet.getElementsByTagName('error');
                if (query && query.length != 0) {
                    result = true;
                }
            }
        }
       return result;
    },

    _parseProfile: function(profile) {
        var data = {};
        data.actions = [];
        var a = profile.attributes;
        if (a) {
            if (a.id && a.device) {
                for (var _i = 0, _len = a.length; _i < _len; _i++) {
                    data[a[_i].name] = a[_i].value;
                }
                var query = profile.getElementsByTagName('action');
                for (var _j = 0, _len1 = query.length; _j < _len1; _j++) {
                    var action = this._parseAction(query[_j]);
                    data.actions.push(action);
                }
            }
        }
        return data;
    },

    _parseAction: function(elem) {
        var data = {};
        var a = elem.attributes;
        if (a) {
            if (a.id && a.label) {
                for (var _i = 0, _len = a.length; _i < _len; _i++) {
                    data[a[_i].name] = a[_i].value;
                }
            }
        }
        return data;
    },

    _parseInterest: function(elem) {
        var data = {};
        var a = elem.attributes;
        if (a) {
            if (a.id) {
                for (var _i = 0, _len = a.length; _i < _len; _i++) {
                    data[a[_i].name] = a[_i].value;
                }
            }
        }
        return data;
    },

    _parseFeature: function(elem) {
        var data = {};
        var a = elem.attributes;
        if (a) {
            if (a.id) {
                for (var _i = 0, _len = a.length; _i < _len; _i++) {
                    data[a[_i].name] = a[_i].value;
                }
            }
        }
        return data;
    },

    _parseSubscription: function(elem) {
        var data = {};
        var a = elem.attributes;
        if (a) {
            for (var _i = 0, _len = a.length; _i < _len; _i++) {
                data[a[_i].name] = a[_i].value;
            }
        }
        return data;
    },

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
                var data = self._parseInterest(query[_i]);
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
                var data = self._parseFeature(query[_i]);
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

    getPrivateStorage: function() {

    },

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
                var data = self._parseSubscription(query[_i]);
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


