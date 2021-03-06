(function () {

  var app = angular.module('roberthodgen.logger', []);


  /*
   * Log
   * Provider that permits configuration at runtime and provides an injectable service ("LogService").
   */
  app.provider('Log', [function () {
    var self = this;


    /**
     * LogProvider.LOG_LEVELS
     * Defines which log levels exist.
     */
    self.LOG_LEVELS = [
      'info',
      'log',
      'debug',
      'warn',
      'error'
    ];


    /**
     * LogProvider.TO_CONSOLE
     * When true, all messages will also be output the the console.
     * Attempts to use an existing log, e.g. `warn`, if that does not exist defaults to `log`.
     */
    self.TO_CONSOLE = false;


    /**
     * LogProvider.ATTACH_TO_WINDOW
     * When true, the Log service will be attached to the window (via $window)
     * so that it is easily accessible via the console as simply "Log".
     */
    self.ATTACH_TO_WINDOW = false;


    /**
     * LogProvider.$get
     * Invoked when "Log" is first injected.
     * Provides the actual "Log" service ("LogService").
     */
    self.$get = ['$window', '$log', 'LogLevelFactory', function ($window, $log, LogLevelFactory) {
      return new LogService(self.LOG_LEVELS, {
        TO_CONSOLE: self.TO_CONSOLE,
        ATTACH_TO_WINDOW: self.ATTACH_TO_WINDOW
      }, $window, $log, LogLevelFactory);
    }];


    /**
     * LogService
     * Actual "Log" service that's injected.
     */
    function LogService (LOG_LEVELS, CONFIG, $window, $log, LogLevelFactory) {
      var self = this;


      /**
       * LogService.createLogLevel
       * Called for every level in LOG_LEVELS.
       * Validates each level as a String or Object then sets LogLevelFactory result on self.
       */
      self.createLogLevel = function (level) {
        if (angular.isString(level)) {
          level = { name: level };
        }

        if (!angular.isObject(level)) {
          throw Error('Unsupported log level. Expected String or Object.');
        }

        if (self.hasOwnProperty(level.name)) {
          throw Error('Cannot create log level. [' + this.level.name + '] already exists on LogService.');
        }

        var log = self[level.name] = LogLevelFactory(level);

        if (CONFIG.TO_CONSOLE === true) {
          log.addHook($log[level.name] || $log.info || angular.noop);
        }

        return log;
      };


      /**
       * Log.attachToWindow
       * Invoked when CONFIG.ATTACH_TO_WINDOW is true.
       * Simply sets $window.Log equal to this Log service.
       */
      self.attachToWindow =  function () {
        $window.Log = self;
        $log.info('roberthodgen.angular-logger: Log service attached to $window, now accessible via the JavaScript console as "Log".');
      };

      LOG_LEVELS.forEach(self.createLogLevel);

      if (CONFIG.ATTACH_TO_WINDOW === true) {
        self.attachToWindow();
      }
    }
  }]);


  /**
   * LOG_HISTORY
   * Object that stores history in key-value pairs where the key is a log level
   * and value is an Array of log items.
   */
  app.constant('LOG_HISTORY', {});


  /**
   * LOG_HOOKS
   * Object that stores hooks in key-value pairs where the key is the log level
   * and value is an Array of hook functions.
   */
  app.constant('LOG_HOOKS', {});


  /**
   * LogLevelFactory
   * Returns a function for logging a given level.
   */
  app.factory('LogLevelFactory', ['LOG_HISTORY', 'LOG_HOOKS', function (LOG_HISTORY, LOG_HOOKS) {
    return function (level) {


      /**
       * LogLevel
       * A that adds an entry into the LOG_HISTORY for a given level.
       */
      function LogLevel (entry) {
        if (angular.isDefined(entry)) {
          LOG_HISTORY[level.name].push(entry);
          callHooks(entry);
        }
      }


      /**
       * Hook caller function.
       * Calls all hooks for this level.
       */
      function callHooks (entry) {
        LOG_HOOKS[level.name].forEach(function (hook) {
          hook(entry);
        });
      }


      /**
       * LogLevel.registerHook
       * Adds a hook function to be called when this .
       */
      LogLevel.addHook = function (hook) {
        if (!angular.isFunction(hook)) {
          throw new Error('Unsupported hook. Expected function got ' + typeof hook);
        }

        LOG_HOOKS[level.name].push(hook);


        /**
         * Deregister function.
         * Removes the (just added) hook from LOG_HOOKS for this level when called.
         */
        function removeHook () {
          var i = LOG_HOOKS[level.name].indexOf(hook);
          if (i > -1) {
            LOG_HOOKS[level.name].splice(i, 1);
          }
        }

        return removeHook;
      };


      /**
       * LOG_HOOKS
       * Initialize.
       * Stores hooks for this log level.
       */
      LOG_HOOKS[level.name] = [];

      if (angular.isArray(level.hooks)) {
        level.hooks.forEach(LogLevel.addHook);
      }


      /**
       * LogLevel.history
       * Initialize.
       * Makes this level's history easily accessible (e.g. Log.debug.history)
       */
      LogLevel.history = LOG_HISTORY[level.name] = [];

      return LogLevel;
    };
  }]);

})();
