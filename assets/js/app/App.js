BIND_PATH = '/http-bind';
BOSH_URL = "http://dogstar.gltd.local/http-bind";

App = {};
Session = {};
App.start = function(options) {
    App.options = options;
    console.log('Application Started');
    if (App.options.app.username) {
        $('#username').val(App.options.app.username);
    }
    if (App.options.app.password) {
        $('#password').val(App.options.app.password);
    }

    if (App.options.app.autologon) {
        $('#gc_signin').click();
    }
}

App.debug = function() {
    if (App.options.app.debug) {
        return true;
    }
    return false;
}

App.clear = function() {
    if (Session.connection) {
        Session.connection.disconnect();
        Session.connection = null;
        console.log("XMPP Disconnect");
    }
}

App.connected = function(connection) {
    Session.connection = connection;
    $('#gc_login_window').hide();
    $('#gc_logout_window').show();

    Session.connection.openlink.sendPresence();

    Session.callHandlerId = Session.connection.openlink.addCallHandler(App.callHandler)
}

App.callHandler = function(callEv, changed) {
    // do something
    console.log("CALL HANDLER: " + changed + " callEv: " + JSON.stringify(callEv));

    $('#gc_call_list ul').empty();
    var calls = Session.connection.openlink.calls;
    for (var cid in Session.connection.openlink.calls) {
        var call = calls[cid];

            var callText = '<li>' + call.id + ' - '
            + call.profile + ' - '
            + call.interest + ' - '
            + call.state + ' - '
            + call.direction;
            if (call.actions.length > 0) {
                callText += '<ul>';
                for (var _i = 0; _i < call.actions.length; _i++) {
                    callText += '<li>Action: ' + call.actions[_i] + '</li>';
                    console.log("CALL TO ARMS!",call.actions[_i]);
                }
                callText += '</ul>';
            } else {
                callText += '<ul><li>No actions available</li></ul>';
            }

            callText += '</li>';

        $('#gc_call_list ul:first').append(callText);
    }

}

App.disconnected = function() {
    $('#gc_logout_window').hide();
    $('#gc_login_window').show();

    Session.connection.openlink.removeCallHandler(Session.callHandlerId);
    delete Session.callHandlerId;
}

$(function() {
});

$(window).unload(function() {
   if (App) {
       App.clear();
   }
});

$('#gc_signin').click(function() {
    App.clear();

    var username = $('#username').val();
    var password = $('#password').val();

    if (username && password) {
        Session.connection = new Strophe.Connection(BOSH_URL);
        connect({
            username: username,
            password: password,
            resource: App.options.app.xmpp_resource,
            domain: App.options.app.xmpp_domain
        });
    }
});

$('#gc_signout').click(function() {
    Session.connection.disconnect();
});

$('#gc_get_profiles').click(function() {
    $('#gc_profile_list ul').empty();
    $('#gc_profile_list ul').append('<li>Loading profiles</li>');
    Session.connection.openlink.getProfiles(getDefaultSystem(), function(profiles) {
        $('#gc_profile_list ul').empty();
        for (var profileId in profiles) {
            var profile = profiles[profileId];

            var profileText = '<li>'
                + profile.id + ' - '
                + profile.device + ' - '
                + '<a href="#" class="gc_get_features" id="gc_get_features_'+ profile.id +'">Get features</a>' + ' - '
                + '<a href="#" class="gc_get_interests" id="gc_get_interests_'+ profile.id +'">Get interests</a>';

            if (profile.actions.length > 0) {
                profileText += '<ul>';
                for (var _i = 0; _i < profile.actions.length; _i++) {
                    profileText += '<li>Action: '
                        + profile.actions[_i].id + ' - '
                        + profile.actions[_i].label
                        + '</li>';
                }
                profileText += '</ul>';
            } else {
                profileText += '<ul><li>No actions found</li></ul>';
            }

            profileText += '</li>';

            $('#gc_profiles ul:first').append(profileText);
        }
    }, function(message) {
        alert(message);
    });
});

$('#gc_profiles').on('click', 'a.gc_get_interests', function(e) {
    e.preventDefault();
    if (e.target.id) {
        var profileId = e.target.id.replace('gc_get_interests_', '');
    }
    getInterestsClick(profileId);
});

function getInterestsClick(profileId) {
    $('#gc_interest_list ul').empty();
    $('#gc_interest_list ul').append('<li>Loading interests</li>');
    Session.connection.openlink.getInterests(getDefaultSystem() , profileId, function(interests) {
        $('#gc_interest_list ul').empty();
        for (var elem in interests) {
            $('#gc_interest_list ul').append('<li>'
                + interests[elem].id + ' - '
                + interests[elem].type + ' - '
                + interests[elem].label + ' - '
                + '<a href="#" class="gc_subscribe_interest" id="gc_subscribe_interest_'+ interests[elem].id +'">Subscribe</a>' + ' - '
                + '<a href="#" class="gc_unsubscribe_interest" id="gc_unsubscribe_interest_'+ interests[elem].id +'">Unsubscribe</a>'

                + '<div id="gc_makecall">'
                + '<a href="#" class="gc_makecall_interest" id="gc_makecall_interest_'+ interests[elem].id +'">Make Call</a>' + ' - '
                + '<input type="text" maxlength="50" value="" id="makecall_extension" placeholder="Extension">'
                + '</div>'

                + '</li>');
        }
    }, function(message) {
        alert(message);
    });
}

$('#gc_profiles').on('click', 'a.gc_get_features', function(e) {
    e.preventDefault();
    if (e.target.id) {
        var profileId = e.target.id.replace('gc_get_features_', '');
    }
    getFeaturesClick(profileId);
});

function getFeaturesClick(profileId) {
    $('#gc_feature_list ul').empty();
    $('#gc_feature_list ul').append('<li>Loading features</li>');
    Session.connection.openlink.getFeatures(getDefaultSystem(), profileId, function(features) {
        $('#gc_feature_list ul').empty();
        for (var elem in features) {
            $('#gc_feature_list ul').append('<li>'
                + features[elem].id + ' - '
                + features[elem].type + ' - '
                + features[elem].label
                + '</li>');
        }
    }, function(message) {
        alert(message);
    });
}

$('#gc_interests').on('click', 'a.gc_subscribe_interest', function(e) {
    e.preventDefault();
    if (e.target.id) {
        var interest = e.target.id.replace('gc_subscribe_interest_', '');
    }
    Session.connection.openlink.subscribe(Session.connection.openlink.getPubsubAddress(), interest, function(message) {
        alert(message);
    }, function(message) {
        alert(message);
    });
});

$('#gc_interests').on('click', 'a.gc_unsubscribe_interest', function(e) {
    e.preventDefault();
    if (e.target.id) {
        var interest = e.target.id.replace('gc_unsubscribe_interest_', '');
    }
    Session.connection.openlink.unsubscribe(Session.connection.openlink.getPubsubAddress(), interest, function(message) {
        alert(message);
    }, function(message) {
        alert(message);
    });
});

$('#gc_interests').on('click', 'a.gc_makecall_interest', function(e) {
    e.preventDefault();
    if (e.target.id) {
        var interest = e.target.id.replace('gc_makecall_interest_', '');
    }
    Session.connection.openlink.makeCall(getDefaultSystem(), interest, $('#makecall_extension').val(),
        [
            { id: 'Conference', value1: true },
            { id: 'CallBack', value1: true }
        ], function(call) {
            alert('Call made with id: ' + call.id);
        },function(message) {
            alert(message);
        });
});

$('#gc_request_action').click(function() {
    var callId = $("#request_action_callid").val();
    var actionId = $("#request_action_actionid").val();
    var value1 = $("#request_action_value1").val();
    var value2 = $("#request_action_value2").val();
    var call = Session.connection.openlink.calls[callId]
    if (call && call.interest) {
        var interest = call.interest;
    }

    Session.connection.openlink.requestAction(getDefaultSystem(), interest, callId, new Action({id: actionId, value1: value1, value2: value2}),function(call) {
        if (call) {
            alert('Call actioned with id: ' + call.id);
        }
    },function(message) {
        alert(message);
    });
});

$('#gc_get_history').click(function() {
    $('#gc_history_list ul').empty();
    $('#gc_history_list ul').append('<li>Loading history</li>');
    Session.connection.openlink.getCallHistory(getDefaultSystem(), "", 
        "", "", "out", "", "", "0", "50", function(history) {
        $('#gc_history_list ul').empty();
        if (history) {
            console.log(history);
        }

        for (var callid in history) {
            var call = history[callid];

            var historyText = call.id + '<ul>';

            for (var property in call) {
                historyText += '<li>' + property + ': ' + call[property] + '</li>';
            }

            historyText += '</ul>';
            $('#gc_history_list ul:first').append(historyText);
        }

    },function(message) {
        alert(message);
    });
});

function getDefaultSystem() {
    return App.options.app.system + '.' + Session.connection.domain;
}

function connect(data) {
    console.log("Connect to: " + BOSH_URL);

    Session.connection.rawInput = function(body) {
        if (App.debug()) {
            console.log('RECV: ' + body);
        }
    };

    Session.connection.rawOutput = function(body) {
        if (App.debug()) {
            console.log('SENT: ' + body);
        }
    };

    var connectionCallback = function(status) {
        if (status == Strophe.Status.ERROR) {
            console.log('Strophe connection error.');
        } else if (status == Strophe.Status.CONNECTING) {
            console.log('Strophe is connecting.');
        } else if (status == Strophe.Status.CONNFAIL) {
            console.log('Strophe failed to connect.');
        } else if (status == Strophe.Status.AUTHENTICATING) {
            console.log('Strophe is authenticating.');
        } else if (status == Strophe.Status.AUTHFAIL) {
            console.log('Strophe failed to authenticate.');
        } else if (status == Strophe.Status.CONNECTED) {
            console.log('Strophe is connected.');
            App.connected(this);
        } else if (status == Strophe.Status.DISCONNECTED) {
            console.log('Strophe is disconnected.');
            App.disconnected();
        } else if (status == Strophe.Status.DISCONNECTING) {
            console.log('Strophe is disconnecting.');
        } else if (status == Strophe.Status.ATTACHED) {
            console.log('Strophe is attached.');
        } else {
            console.log('Strophe unknown: ' + status);
        }
    };

    var jid = data.username + "@" + data.domain + "/" + data.resource;
    console.log("Connect: jid: " + jid);
    Session.connection.connect(jid, data.password, connectionCallback);
}


