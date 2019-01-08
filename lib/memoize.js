'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.eqCheck = undefined;

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

exports.memoize = memoize;

var _every = require('lodash/every');

var _every2 = _interopRequireDefault(_every);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var defaultEqualityCheck = function defaultEqualityCheck(a, b) {
    return a === b;
};
var eqCheck = exports.eqCheck = defaultEqualityCheck;

var argsAreEqual = function argsAreEqual(lastArgs, nextArgs, equalityCheck) {
    return nextArgs.every(function (arg, index) {
        return equalityCheck(arg, lastArgs[index]);
    });
};

var rowsAreEqual = function rowsAreEqual(ids, rowsA, rowsB) {
    return ids.every(function (id) {
        return rowsA[id] === rowsB[id];
    });
};

var tablesAreEqual = function tablesAreEqual(rowsA, rowsB) {
    var rowIdsA = (0, _keys2.default)(rowsA);
    var rowIdsB = (0, _keys2.default)(rowsB);

    if (rowIdsA.length !== rowIdsB.length) {
        /**
         * the table contains new rows or old ones were removed
         * this immediately means the table has been updated
         */
        return false;
    }

    return rowsAreEqual(rowIdsA, rowsA, rowsB) && rowsAreEqual(rowIdsB, rowsA, rowsB);
};

var accessedModelInstancesAreEqual = function accessedModelInstancesAreEqual(previous, ormState) {
    var accessedModelInstances = previous.accessedModelInstances;


    return (0, _every2.default)(accessedModelInstances, function (accessedInstances, modelName) {
        var previousRows = previous.ormState[modelName].itemsById;
        var rows = ormState[modelName].itemsById;


        var accessedIds = (0, _keys2.default)(accessedInstances);
        return rowsAreEqual(accessedIds, previousRows, rows);
    });
};

var fullTableScannedModelsAreEqual = function fullTableScannedModelsAreEqual(previous, ormState) {
    var fullTableScannedModels = previous.fullTableScannedModels;


    return fullTableScannedModels.every(function (modelName) {
        var previousRows = previous.ormState[modelName].itemsById;
        var rows = ormState[modelName].itemsById;

        /**
         * all of this model's instances were checked against some condition
         * invalidate them unless none of them have changed
         */

        return tablesAreEqual(previousRows, rows);
    });
};

/**
 * A memoizer to use with redux-orm
 * selectors. When the memoized function is first run,
 * the memoizer will remember the models that are accessed
 * during that function run.
 *
 * On subsequent runs, the memoizer will check if those
 * models' states have changed compared to the previous run.
 *
 * Memoization algorithm operates like this:
 *
 * 1. Has the selector been run before? If not, go to 5.
 *
 * 2. If the selector has other input selectors in addition to the
 *    ORM state selector, check their results for equality with the previous results.
 *    If they aren't equal, go to 5.
 *
 * 3. Is the ORM state referentially equal to the previous ORM state the selector
 *    was called with? If yes, return the previous result.
 *
 * 4. Check which Model's instances the selector has accessed on previous runs.
 *    Check for equality with each of those states versus their states in the
 *    previous ORM state. If all of them are equal, return the previous result.
 *
 * 5. Run the selector. Check the Session object used by the selector for
 *    which Model's states were accessed, and merge them with the previously
 *    saved information about accessed models (if-else branching can change
 *    which models are accessed on different inputs). Save the ORM state and
 *    other arguments the selector was called with, overriding previously
 *    saved values. Save the selector result. Return the selector result.
 *
 * @private
 * @param  {Function} func - function to memoize
 * @param  {Function} argEqualityCheck - equality check function to use with normal
 *                                       selector args
 * @param  {ORM} orm - a redux-orm ORM instance
 * @return {Function} `func` memoized.
 */
function memoize(func) {
    var argEqualityCheck = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defaultEqualityCheck;
    var orm = arguments[2];

    var previous = {
        /* result of the previous function call */
        result: null,
        /* arguments to the previous function call (excluding ORM state) */
        args: null,
        /**
         * lets us know how the models looked like
         * during the previous function call
         */
        ormState: null,
        /**
        * array of names of models whose tables have been scanned completely
        * during previous function call (contains only model names)
        * format (e.g.): ['Book']
        */
        fullTableScannedModels: [],
        /**
        * map of which model instances have been accessed
        * during previous function call (contains only IDs of accessed instances)
        * format (e.g.): { Book: { 1: true, 3: true } }
        */
        accessedModelInstances: {}
    };

    return function () {
        for (var _len = arguments.length, stateAndArgs = Array(_len), _key = 0; _key < _len; _key++) {
            stateAndArgs[_key] = arguments[_key];
        }

        var ormState = stateAndArgs[0],
            args = stateAndArgs.slice(1);


        var selectorWasCalledBefore = previous.args && previous.ormState;

        if (selectorWasCalledBefore && argsAreEqual(previous.args, args, argEqualityCheck) && accessedModelInstancesAreEqual(previous, ormState) && fullTableScannedModelsAreEqual(previous, ormState)) {
            /**
             * the instances that were accessed as well as
             * the arguments that were passed to func the previous time that
             * func was called have not changed
             */
            return previous.result;
        }

        /* previous result is no longer valid, update cached values */
        previous.args = args;

        var session = orm.session(ormState);
        previous.ormState = ormState;

        /* this is where we call the actual function */
        var result = func.apply(undefined, [session].concat((0, _toConsumableArray3.default)(args)));
        previous.result = result;

        /* rows retrieved during function call */
        previous.accessedModelInstances = session.accessedModelInstances;
        /* tables that had to be scanned completely */
        previous.fullTableScannedModels = session.fullTableScannedModels;

        return result;
    };
}