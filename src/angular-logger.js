(function () {

  var app = angular.module('roberthodgen.angular-logger', []);


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
      'debug',
      'warn',
      'error'
    ];


    /**
     * LogProvider.TO_CONSOLE_LOG
     * When true, all messages will also be output the the console.
     *
     */
    self.TO_CONSOLE_LOG = true;


    /**
     * LogProvider.ATTACH_TO_WINDOW
     * When true, the Log service will be attached to the window (via $window)
     * so that it is easily accessible via the console as simply "Log".
     */
    self.ATTACH_TO_WINDOW = true;


    /**
     * LogProvider.$get
     * Invoked when "Log" is first injected.
     * Provides the actual "Log" service ("LogService").
     */
    self.$get = ['$window', 'LOG_HISTORY', 'LogLevelFactory', function ($window, LOG_HISTORY, LogLevelFactory) {
      return new LogService(self.LOG_LEVELS, {
        TO_CONSOLE_LOG: self.TO_CONSOLE_LOG,
        ATTACH_TO_WINDOW: self.ATTACH_TO_WINDOW
      }, $window, LOG_HISTORY, LogLevelFactory);
    }];


    /**
     * LogService
     * Actual "Log" service that's injected.
     */
    function LogService (LOG_LEVELS, CONFIG, $window, LOG_HISTORY, LogLevelFactory) {
      var self = this;

      function CreateLogLevelException (level) {
        this.level = level;
        this.toString = function () {
          return 'Cannot create log level [' + this.level + ']';
        }
      }

      self.createLogLevel = function (level) {
        if (self.hasOwnProperty(level)) {
          throw CreateLogLevelException(level);
        }

        LOG_HISTORY[level] = [];
        self[level] = LogLevelFactory(level);
      }


      /**
       * Log.attachToWindow
       * Invoked when CONFIG.ATTACH_TO_WINDOW is true.
       * Simply sets $window.Log equal to this Log service.
       */
       self.attachToWindow =  function () {
        $window.Log = self;
        console.info('roberthodgen.angular-logger: Log service attached to $window, now accessible via the JavaScript console as "Log".');
      };


      for (var i in LOG_LEVELS) {
        if (i && LOG_LEVELS[i]) {
          self.createLogLevel(LOG_LEVELS[i]);
        }
      }

      if (CONFIG.ATTACH_TO_WINDOW === true) {
        self.attachToWindow();
      }

      if (CONFIG.TO_CONSOLE_LOG === true) {
        // TODO: Create a hook to log all log levels...
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
      if (angular.isString(level)) {
        level = { name: level };
      }

      if (!angular.isObject(level)) {
        throw LogLevelFactoryException(level);
      }


      /**
       * LogLevel
       * A that adds an entry into the LOG_HISTORY for a given level.
       */
      function LogLevel (entry) {
        if (angular.isDefined(entry)) {
          LOG_HISTORY[level.name].push(entry);

          LOG_HOOKS[level.name].forEach(function (hook) {
            hook(entry);
          });
        }
      }


      /**
       * LogLevel.history
       * Makes this level's history easily accessible (e.g. Log.debug.history)
       */
      LogLevel.history = LOG_HISTORY[level.name] = [];


      /**
       * LOG_HOOKS
       */
      LOG_HOOKS[level.name] = [];


      /**
       * LogLevel.registerHook
       * Adds a hook function to be called when this .
       */
       LogLevel.addHook = function (hook) {
        if (!angular.isFunction(hook)) {
          throw LogLevelFactoryHookException(hook);
        }

        LOG_HOOKS[level.name].push(hook);

        function removeHook () {
          var i = LOG_HOOKS[level.name].indexOf(hook);
          if (i > -1) {
            return delete LOG_HOOKS[level.name][i];
          }
        }

        return removeHook;
       };


      /**
       * LogLevelFactoryException
       *
       */
      function LogLevelFactoryException (value) {
        this.value = value;
        this.toString = function () {
          return 'Unsupported log level. Expected String or Object.';
        }
      }


      /**
       * LogLevelFactoryHookException
       */
      function LogLevelFactoryHookException (value) {
        this.value = value;
        this.toString = function () {
          return 'Unsupported hook. Expected String, got ' + typeof this.value;
        }
      }

      return LogLevel;
    };
  }]);

})();
