module.exports = function(grunt) {
 
// configure the tasks
grunt.initConfig({
 
	copy: {
	  other: {
	    cwd: 'assets',
	    src: [ 'img/**' ],
//            src: [ '**', '!**/*.js', '!**/*.css', '!**/*.html' ],
            dest: 'build',
            expand: true
	  },
	  javascript: {
	    cwd: 'assets',
	    src: [ '**/*.js' ],
	    dest: 'build',
	    expand: true
	  },
	  stylesheets: {
	    cwd: 'assets',
	    src: [ '**/*.css' ],
	    dest: 'build',
	    expand: true
	  },
	  html: {
	    cwd: 'assets',
	    src: [ '**/*.html' ],
	    dest: 'build',
	    expand: true
	  },
	},

	clean: {
	  build: {
	    src: [ 'build' ]
	  },
	  stylesheets: {
	    src: [ 'build/**/*.css', 'build/**/css/**', '!build/application.css' ]
	  },
	  javascript: {
	    src: [ 'build/**/*.js', 'build/**/js/**', '!build/application.min.js', '!build/application.js', '!build/templates.js' ]
	  },
	  html: {
	    src: [ 'build/**/templates/**', 'build/**/*.html' ]
	  }
	},

	watch: {
		stylesheets: {
			files: 'assets/**/*.css',
			tasks: [ 'stylesheets' ]
		},
		scripts: {
			files: 'assets/**/*.js',
			tasks: [ 'javascript' ]
		},
		html: {
			files: 'assets/**/*.html',
			tasks: [ 'html' ]
		}
	},

	jst: {
	  compile: {
	    options: {
	      prettify: true
	    },
	    files: {
	      "build/templates.js": ["build/**/*.html"]
	    }
	  }
	},

	uglify: {
	  build: {
	    options: {
	      mangle: false
	    },
	    files: {
	      'build/application.min.js': [ 'build/application-no-logging.js' ]
	    }
	  }
	},

	removelogging: {
		dist: {
			src: "build/application.js",
			dest: "build/application-no-logging.js"
		}
	},

	concat: {
	  options: {
	    separator: ';',
	  },
	  dist: {
	    src: ['build/js/vendor/jquery.js', 'build/js/app/scripts/jquery-1-11-1_before.js', 'build/js/vendor/underscore.js', 'build/js/vendor/*.js', '!build/js/vendor/backbone.marionette.js', 
			'build/js/app/lib/*.js',
                        'build/js/app/App.js', 
                        'build/js/app/callstatus/*.js',
                        'build/js/app/devicestatus/*.js',
                        'build/js/app/feature/*.js',
                        'build/js/app/interest/*.js',
                        'build/js/app/pubsub/*.js',
                        'build/js/app/scripts/jquery-1-11-1_after.js',
			'!build/application.js', '!build/application.min.js'],
	    dest: 'build/application.js',
	  },
	},
	
	cssmin: {
	  build: {
	    files: {
	      'build/application.css': [ 'build/**/*.css', '!build/application.css' ]
	    }
	  }
	},

});
 
// load the tasks
grunt.loadNpmTasks('grunt-contrib-copy');
grunt.loadNpmTasks('grunt-contrib-clean'); 
grunt.loadNpmTasks('grunt-contrib-uglify');
grunt.loadNpmTasks('grunt-contrib-concat');
grunt.loadNpmTasks('grunt-contrib-cssmin');
grunt.loadNpmTasks('grunt-contrib-jst');
grunt.loadNpmTasks('grunt-contrib-watch');
grunt.loadNpmTasks("grunt-remove-logging");

// define the tasks
grunt.registerTask(
  'javascript', 
  'Compiles the JavaScript Files.', 
  [ 'copy:javascript', 'concat', 'removelogging', 'uglify', 'clean:javascript' ]
);

grunt.registerTask(
  'stylesheets', 
  'Compiles the stylesheets.', 
  [ 'copy:stylesheets', 'cssmin', 'clean:stylesheets' ]
);

grunt.registerTask(
  'html',
  'Compiles the HTML.',
  [ 'copy:html', 'jst', 'clean:html' ]
);

grunt.registerTask(
  'build', 
  'Compiles all of the assets and copies the files to the build directory.', 
//  [ 'clean:build', 'copy:other', 'javascript', 'stylesheets', 'html' ]
  [ 'clean:build', 'copy:other', 'javascript', 'stylesheets' ]
);

grunt.registerTask(
  'autobuild',
  'Auto build when changes happen',
  [ 'watch' ]
);

};


