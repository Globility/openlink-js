# Globility implementation of Openlink library for Strophe.js

##Description

This application uses [Strophe.js](https://github.com/strophe/strophejs) to provide an implementation of the [Openlink XMPP API](http://openlink.4ng.net:8080/openlink/xep-xxx-openlink_15-11.xml).

##Components

###OpenlinkJS XMPP Library

The OpenlinkJS library itself is found in `strophe.openlink.js`. It is a plugin for the [Strophe.js](https://github.com/strophe/strophejs) library.

More information about Strophe.js plugins can be found [here](http://professionalxmpp.com/profxmpp_ch14.pdf). But the short 
summary is to simply drop the file `strophe.openlink.js` alongside the `strophe.js` lib into your web application.
 
The `strophe.openlink.js` library is referenced by calling the `Strophe.Connection` object with `connection.openlink`.

Dependencies for the strophe and strophe.openlink libraries are none. jQuery is not required.

**NOTE:** The steps below are only for compiling the Demo Application, they are not needed to use the plugin and strophe library.

###Openlink Demo Application

The Openlink Demo Application consists of the files `App.js` and `index.html`.

Please refer to `index.html` to view an example of the application within a page. You will need to compile the application before running it as per the steps below.

##Getting started with the Openlink Demo Application

If you haven’t already done so, install Node.js and NPM. You also need to install the Grunt command line interface by running 
`npm install -g grunt-cli`. This allows you to run the grunt command from anywhere on your system.

Run `npm install` in your console to install the dependencies.

Run `grunt build` to compile the assets into `build/`.

Run `grunt watch` to auto compile the assets into `build/` as changes are made to `assets/`.

###Layout

The items required to use the application can all be found in the `build` folder.
* `assets/img` - Image assets
* `assets/css` - Any CSS files are compiled as `build/application.css`.
* `assets/js` - Any JS files are iterated over and compiled as `build/application.js`
* Everything between `<!-- Application -->` defines the App. This includes:
    * javascript - `application.js`.
    * init script which stars the application - `App.start({...});`

###Application Arguments

The applications arguments are:
* `debug`: true/false - enables debugging to console 
By default it suffixes the bind path. So on Openfire the full path would be `http://SERVER:7070/http-bind`. 
* `xmpp_domain`: The XMPP domain.
* `xmpp_resource`: Your XMPP resource.
* `username`: Optional username to pre-populate the example app.
* `password`: Optional password to pre-populate the example app.
* `system`: vmstsp/cisco/avaya/etc - defines the default component the example App uses to send Openlink commands 
* `autologon`: true/false - enables auto logging on on page load.

Two application parameters need to be defined in the app itself:
* `BIND_PATH`: /http-bind - defines the bind URL path.
* `BOSH_URL`: defines the full URL used to connect to the BOSH service.

##Application Guide

Whilst the index.html and App.js files are only a guide they follow the standard structure for Strophe.js applications.

###Connecting

    Session.connection = new Strophe.Connection(BOSH_URL);
    connect({
        username: username,
        password: password,
        resource: xmpp_resource,
        domain: xmpp_domain
    });

Where connect is a function as defined in `App.js`. This callback handles all connection events in the `connectionCallback` object and triggers
the Strophe.js `Session.connection.connect` method which actually invokes the XMPP connection.

###Disconnecting

**Disconnect**
    Session.connection.disconnect();

###Connected/Disconnected Events

**Connected Event** This can be listened for in the `connectionCallback` alongside several other XMPP connection notifications like authentication failed, etc.

    if (status == Strophe.Status.CONNECTED) {
        console.log('Strophe is connected.');
        App.connected(this);
    }

**Disconnected Event**

    if (status == Strophe.Status.DISCONNECTED) {
        console.log('Strophe is disconnected.');
        App.disconnected();
    }

###Presence

Presence can be controlled very finely in XMPP. To fire a presence packet and notify the server that you're ready to receive messages simply call:

    Session.connection.openlink.sendPresence();


###Call Events

A call handler can be registered to simplify the process of receiving pubsub call events. Simply call:

    Session.callHandlerId = Session.connection.openlink.addCallHandler(function(callEv, changed) {...});

Store the returned callHandlerId in order to unregister the handler on disconnect:

    Session.connection.openlink.removeCallHandler(Session.callHandlerId);

##License

`This file is subject to the terms and conditions defined 3in file 'LICENSE', which is part of this source code package.`