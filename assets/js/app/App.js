var BIND_PATH = '/http-bind';
var BOSH_URL = window.location.protocol + '//' + window.location.hostname + BIND_PATH;
resource = 'office';

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
}

App.disconnected = function() {
    $('#gc_logout_window').hide();
    $('#gc_login_window').show();
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
    Session.connection.openlink.getProfiles(App.options.app.system + '.' + Session.connection.domain, function(profiles) {
        $('#gc_profile_list ul').empty();
        for (var elem in profiles) {
            $('#gc_profile_list ul').append('<li>'
                + profiles[elem].id + ' - '
                + profiles[elem].device + ' - '
                + Object.keys(profiles[elem].actions).length + ' actions' + ' - '
                + '<a href="#" class="gc_get_interests" id="gc_get_interests_'+ profiles[elem].id +'">Get interests</a>' + ' - '
                + '<a href="#" class="gc_get_features" id="gc_get_features_'+ profiles[elem].id +'">Get features</a>'
                + '</li>');
        }
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
    Session.connection.openlink.getInterests(App.options.app.system + '.' + Session.connection.domain, profileId, function(interests) {
        $('#gc_interest_list ul').empty();
        for (var elem in interests) {
            $('#gc_interest_list ul').append('<li>'
                + interests[elem].id + ' - '
                + interests[elem].type + ' - '
                + interests[elem].label + ' - '
                + '<a href="#" class="gc_subscribe_interest" id="gc_subscribe_interest_'+ interests[elem].id +'">Subscribe</a>' + ' - '
                + '<a href="#" class="gc_unsubscribe_interest" id="gc_unsubscribe_interest_'+ interests[elem].id +'">Unsubscribe</a>'
                + '</li>');
        }
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
    Session.connection.openlink.getFeatures(App.options.app.system + '.' + Session.connection.domain, profileId, function(features) {
        $('#gc_feature_list ul').empty();
        for (var elem in features) {
            $('#gc_feature_list ul').append('<li>'
                + features[elem].id + ' - '
                + features[elem].type + ' - '
                + features[elem].label
                + '</li>');
        }
    });
}

$('#gc_interests').on('click', 'a.gc_subscribe_interest', function(e) {
    e.preventDefault();
    if (e.target.id) {
        var interest = e.target.id.replace('gc_subscribe_interest_', '');
    }
    Session.connection.openlink.subscribe(getPubsubAddress(), interest);
});

$('#gc_interests').on('click', 'a.gc_unsubscribe_interest', function(e) {
    e.preventDefault();
    if (e.target.id) {
        var interest = e.target.id.replace('gc_unsubscribe_interest_', '');
    }
    Session.connection.openlink.unsubscribe(getPubsubAddress(), interest);
});

function getPubsubAddress() {
    return 'pubsub.' + Session.connection.domain;
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


