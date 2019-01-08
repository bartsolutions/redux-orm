'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _extends3 = require('babel-runtime/helpers/extends');

var _extends4 = _interopRequireDefault(_extends3);

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

var _defineProperty4 = require('babel-runtime/core-js/object/define-property');

var _defineProperty5 = _interopRequireDefault(_defineProperty4);

var _setPrototypeOf = require('babel-runtime/core-js/reflect/set-prototype-of');

var _setPrototypeOf2 = _interopRequireDefault(_setPrototypeOf);

var _construct = require('babel-runtime/core-js/reflect/construct');

var _construct2 = _interopRequireDefault(_construct);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _immutableOps = require('immutable-ops');

var _constants = require('./constants');

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Session = function () {
    /**
     * Creates a new Session.
     *
     * @param  {Database} db - a {@link Database} instance
     * @param  {Object} state - the database state
     * @param  {Boolean} [withMutations] - whether the session should mutate data
     * @param  {Object} [batchToken] - used by the backend to identify objects that can be
     *                                 mutated.
     */
    function Session(schema, db, state, withMutations, batchToken) {
        var _this = this;

        (0, _classCallCheck3.default)(this, Session);

        this.schema = schema;
        this.db = db;
        this.state = state || db.getEmptyState();
        this.initialState = this.state;

        this.withMutations = !!withMutations;
        this.batchToken = batchToken || (0, _immutableOps.getBatchToken)();

        this.modelData = {};

        this.models = schema.getModelClasses();

        this.sessionBoundModels = this.models.map(function (modelClass) {
            function SessionBoundModel() {
                return (0, _construct2.default)(modelClass, arguments, SessionBoundModel); // eslint-disable-line prefer-rest-params
            }
            (0, _setPrototypeOf2.default)(SessionBoundModel.prototype, modelClass.prototype);
            (0, _setPrototypeOf2.default)(SessionBoundModel, modelClass);

            (0, _defineProperty5.default)(_this, modelClass.modelName, {
                get: function get() {
                    return SessionBoundModel;
                }
            });

            SessionBoundModel.connect(_this);
            return SessionBoundModel;
        });
    }

    (0, _createClass3.default)(Session, [{
        key: 'getDataForModel',
        value: function getDataForModel(modelName) {
            if (!this.modelData[modelName]) {
                this.modelData[modelName] = {};
            }
            return this.modelData[modelName];
        }
    }, {
        key: 'markAccessed',
        value: function markAccessed(modelName, modelIds) {
            var data = this.getDataForModel(modelName);
            if (!data.accessedInstances) {
                data.accessedInstances = {};
            }
            modelIds.forEach(function (id) {
                data.accessedInstances[id] = true;
            });
        }
    }, {
        key: 'markFullTableScanned',
        value: function markFullTableScanned(modelName) {
            var data = this.getDataForModel(modelName);
            data.fullTableScanned = true;
        }
    }, {
        key: 'applyUpdate',


        /**
         * Applies update to a model state.
         *
         * @private
         * @param {Object} update - the update object. Must have keys
         *                          `type`, `payload`.
         */
        value: function applyUpdate(updateSpec) {
            var tx = this._getTransaction(updateSpec);
            var result = this.db.update(updateSpec, tx, this.state);
            var status = result.status,
                state = result.state,
                payload = result.payload;


            if (status !== _constants.SUCCESS) {
                throw new Error('Applying update failed with status ' + status + '. Payload: ' + payload);
            }

            this.state = state;

            return payload;
        }
    }, {
        key: 'query',
        value: function query(querySpec) {
            var result = this.db.query(querySpec, this.state);

            this._markAccessedByQuery(querySpec, result);

            return result;
        }
    }, {
        key: 'idExists',
        value: function idExists(tableName, id) {
            return this.db.idExists(tableName, id, this.state);
        }
    }, {
        key: '_getTransaction',
        value: function _getTransaction(updateSpec) {
            var withMutations = this.withMutations;
            var action = updateSpec.action;
            var batchToken = this.batchToken;

            if ([_constants.UPDATE, _constants.DELETE].includes(action)) {
                batchToken = (0, _immutableOps.getBatchToken)();
            }
            return { batchToken: batchToken, withMutations: withMutations };
        }
    }, {
        key: '_markAccessedByQuery',
        value: function _markAccessedByQuery(querySpec, result) {
            var table = querySpec.table,
                clauses = querySpec.clauses;
            var rows = result.rows;
            var idAttribute = this[table].idAttribute;

            var accessedIds = new _set2.default(rows.map(function (row) {
                return row[idAttribute];
            }));

            var anyClauseFilteredById = clauses.some(function (clause) {
                if (!(0, _utils.clauseFiltersByAttribute)(clause, idAttribute)) {
                    return false;
                }
                /**
                 * we previously knew which row we wanted to access,
                 * so there was no need to scan the entire table
                 */
                var id = clause.payload[idAttribute];
                accessedIds.add(id);
                return true;
            });

            if (anyClauseFilteredById) {
                /**
                 * clauses have been ordered so that an indexed one was
                 * the first to be evaluated, and thus only the row
                 * with the specified id has actually been accessed
                 */
                this.markAccessed(table, accessedIds);
            } else {
                /**
                 * any other clause would have caused a full table scan,
                 * even if we specified an empty clauses array
                 */
                this.markFullTableScanned(table);
            }
        }

        // DEPRECATED AND REMOVED METHODS

        /**
         * @deprecated Access {@link Session#state} instead.
         */

    }, {
        key: 'getNextState',
        value: function getNextState() {
            (0, _utils.warnDeprecated)('`Session.prototype.getNextState` has been deprecated. Access ' + 'the `Session.prototype.state` property instead.');
            return this.state;
        }

        /**
         * @deprecated
         * The Redux integration API is now decoupled from ORM and Session.<br>
         * See the 0.9 migration guide in the GitHub repo.
         */

    }, {
        key: 'reduce',
        value: function reduce() {
            throw new Error('`Session.prototype.reduce` has been removed. The Redux integration API ' + 'is now decoupled from ORM and Session - see the 0.9 migration guide ' + 'in the GitHub repo.');
        }
    }, {
        key: 'accessedModelInstances',
        get: function get() {
            var _this2 = this;

            return this.sessionBoundModels.filter(function (_ref) {
                var modelName = _ref.modelName;
                return !!_this2.getDataForModel(modelName).accessedInstances;
            }).reduce(function (result, _ref2) {
                var modelName = _ref2.modelName;
                return (0, _extends4.default)({}, result, (0, _defineProperty3.default)({}, modelName, _this2.getDataForModel(modelName).accessedInstances));
            }, {});
        }
    }, {
        key: 'fullTableScannedModels',
        get: function get() {
            var _this3 = this;

            return this.sessionBoundModels.filter(function (_ref3) {
                var modelName = _ref3.modelName;
                return !!_this3.getDataForModel(modelName).fullTableScanned;
            }).map(function (_ref4) {
                var modelName = _ref4.modelName;
                return modelName;
            });
        }
    }]);
    return Session;
}();

exports.default = Session;