module.exports = function (context) {

  var config = {
    exceptions: {
      "err": true,
      "res": true,
      "callback": true
    }
  };

  if(context.options[0]) {
    var userExceptions = context.options[0].exceptions || {};
    for(var exception in userExceptions) {
      if(userExceptions.hasOwnProperty(exception)) {
        config.exceptions[exception] = userExceptions[exception];
      }
    }
  }

  /**
   * Checks if a variable is contained in the list of given scope variables.
   * @param {Object} variable The variable to check.
   * @param {Array} scopeVars The scope variables to look for.
   * @returns {boolean} Whether or not the variable is contains in the list of scope variables.
   */
  function isContainedInScopeVars(variable, scopeVars) {
    return scopeVars.some(function (scopeVar) {
      if (scopeVar.identifiers.length > 0) {
        return variable.name === scopeVar.name;
      }
      return false;
    });
  }

  /**
   * Checks if the given variables are shadowed in the given scope.
   * @param {Array} variables The variables to look for
   * @param {Object} scope The scope to be checked.
   * @returns {void}
   */
  function checkShadowsInScope(variables, scope) {
    variables.forEach(function (variable) {
      if (isContainedInScopeVars(variable, scope.variables) &&
        // "arguments" is a special case that has no identifiers (#1759)
        variable.identifiers.length > 0 &&
        !config.exceptions[variable.name]
      ) {
        context.report(variable.identifiers[0], "{{a}} is already declared in the upper scope.", {a: variable.name});
      }
    });
  }

  /**
   * Checks the current context for shadowed variables.
   * @returns {void}
   */
  function checkForShadows() {
    var scope = context.getScope();
    var variables = scope.variables;

    // iterate through the array of variables and find duplicates with the upper scope
    var upper = scope.upper;
    while (upper) {
      checkShadowsInScope(variables, upper);
      upper = upper.upper;
    }
  }

  return {
    "FunctionDeclaration": checkForShadows,
    "FunctionExpression": checkForShadows
  };
};