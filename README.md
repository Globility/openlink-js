# Globility implementation of Openlink library for StropheJS

##Description

This application uses [Strophe.js](https://github.com/strophe/strophejs) to provide an implementation of the [Openlink XMPP API](http://openlink.4ng.net:8080/openlink/xep-xxx-openlink_15-11.xml).

##Getting started

If you haven’t already done so, install Node.js and NPM. You also need to install the Grunt command line interface by running `npm install -g grunt-cli`. This allows you to run the grunt command from anywhere on your system.

Run `npm install` in your console to install the dependencies.

Run `grunt build` to compile the assets into `build/`.

Run `grunt watch` to auto compile the assets into `build/` as changes are made to `assets/`.

##Integrating

Please refer to `index.html` to view an example of the application within a page.

The items required to use the application can all be found in the `build` folder.

* Any image assets in `img` need to be correctly referenced in the CSS and index.html files relative to your environment.
* stylesheet - `application.css`.
* Everything between `<!-- Application -->`. This includes:
    * javascript - `application.js`.
    * init script which stars the application - `App.start({...});`

(The file `index.html` is used during development and refers directly to the various application source files.)

##License

`This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.`
 
##License

`This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.`
