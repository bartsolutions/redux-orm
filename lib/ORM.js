'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ORM = undefined;

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

exports.DeprecatedSchema = DeprecatedSchema;

var _forOwn = require('lodash/forOwn');

var _forOwn2 = _interopRequireDefault(_forOwn);

var _find = require('lodash/find');

var _find2 = _interopRequireDefault(_find);

var _Session = require('./Session');

var _Session2 = _interopRequireDefault(_Session);

var _Model2 = require('./Model');

var _Model3 = _interopRequireDefault(_Model2);

var _db = require('./db');

var _fields = require('./fields');

var _redux = require('./redux');

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ORM_DEFAULTS = {
    createDatabase: _db.createDatabase
};

/**
 * ORM - the Object Relational Mapper.
 *
 * Use instances of this class to:
 *
 * - Register your {@link Model} classes using {@link ORM#register}
 * - Get the empty state for the underlying database with {@link ORM#getEmptyState}
 * - Start an immutable database session with {@link ORM#session}
 * - Start a mutating database session with {@link ORM#mutableSession}
 *
 * Internally, this class handles generating a schema specification from models
 * to the database.
 */

var ORM = exports.ORM = function () {
    /**
     * Creates a new ORM instance.
     */
    function ORM(opts) {
        (0, _classCallCheck3.default)(this, ORM);

        var _Object$assign = (0, _assign2.default)({}, ORM_DEFAULTS, opts || {}),
            createDatabase = _Object$assign.createDatabase;

        this.createDatabase = createDatabase;
        this.registry = [];
        this.implicitThroughModels = [];
        this.installedFields = {};
    }

    /**
     * Registers a {@link Model} class to the ORM.
     *
     * If the model has declared any ManyToMany fields, their
     * through models will be generated and registered with
     * this call, unless a custom through model has been specified.
     *
     * @param  {...Model} model - a {@link Model} class to register
     * @return {undefined}
     */


    (0, _createClass3.default)(ORM, [{
        key: 'register',
        value: function register() {
            var _this = this;

            for (var _len = arguments.length, models = Array(_len), _key = 0; _key < _len; _key++) {
                models[_key] = arguments[_key];
            }

            models.forEach(function (model) {
                if (model.modelName === undefined) {
                    throw new Error('A model was passed that doesn\'t have a modelName set');
                }

                model.invalidateClassCache();

                _this.registerManyToManyModelsFor(model);
                _this.registry.push(model);
            });
        }
    }, {
        key: 'registerManyToManyModelsFor',
        value: function registerManyToManyModelsFor(model) {
            var _this4 = this;

            var fields = model.fields;

            var thisModelName = model.modelName;

            (0, _forOwn2.default)(fields, function (fieldInstance, fieldName) {
                if (!(fieldInstance instanceof _fields.ManyToMany)) {
                    return;
                }

                var toModelName = void 0;
                if (fieldInstance.toModelName === 'this') {
                    toModelName = thisModelName;
                } else {
                    toModelName = fieldInstance.toModelName; // eslint-disable-line prefer-destructuring
                }

                var selfReferencing = thisModelName === toModelName;
                var fromFieldName = (0, _utils.m2mFromFieldName)(thisModelName);
                var toFieldName = (0, _utils.m2mToFieldName)(toModelName);

                if (fieldInstance.through) {
                    if (selfReferencing && !fieldInstance.throughFields) {
                        throw new Error('Self-referencing many-to-many relationship at ' + ('"' + thisModelName + '.' + fieldName + '" using custom ') + ('model "' + fieldInstance.through + '" has no ') + 'throughFields key. Cannot determine which ' + 'fields reference the instances partaking ' + 'in the relationship.');
                    }
                } else {
                    var _Through$fields;

                    var Through = function (_Model) {
                        (0, _inherits3.default)(ThroughModel, _Model);

                        function ThroughModel() {
                            (0, _classCallCheck3.default)(this, ThroughModel);
                            return (0, _possibleConstructorReturn3.default)(this, (ThroughModel.__proto__ || (0, _getPrototypeOf2.default)(ThroughModel)).apply(this, arguments));
                        }

                        return ThroughModel;
                    }(_Model3.default);

                    Through.modelName = (0, _utils.m2mName)(thisModelName, fieldName);

                    var PlainForeignKey = function (_ForeignKey) {
                        (0, _inherits3.default)(ThroughForeignKeyField, _ForeignKey);

                        function ThroughForeignKeyField() {
                            (0, _classCallCheck3.default)(this, ThroughForeignKeyField);
                            return (0, _possibleConstructorReturn3.default)(this, (ThroughForeignKeyField.__proto__ || (0, _getPrototypeOf2.default)(ThroughForeignKeyField)).apply(this, arguments));
                        }

                        (0, _createClass3.default)(ThroughForeignKeyField, [{
                            key: 'installsBackwardsVirtualField',
                            get: function get() {
                                return false;
                            }
                        }, {
                            key: 'installsBackwardsDescriptor',
                            get: function get() {
                                return false;
                            }
                        }]);
                        return ThroughForeignKeyField;
                    }(_fields.ForeignKey);
                    var ForeignKeyClass = selfReferencing ? PlainForeignKey : _fields.ForeignKey;
                    Through.fields = (_Through$fields = {
                        id: (0, _fields.attr)()
                    }, (0, _defineProperty3.default)(_Through$fields, fromFieldName, new ForeignKeyClass(thisModelName)), (0, _defineProperty3.default)(_Through$fields, toFieldName, new ForeignKeyClass(toModelName)), _Through$fields);

                    Through.invalidateClassCache();
                    _this4.implicitThroughModels.push(Through);
                }
            });
        }

        /**
         * Gets a {@link Model} class by its name from the registry.
         * @param  {string} modelName - the name of the {@link Model} class to get
         * @throws If {@link Model} class is not found.
         * @return {Model} the {@link Model} class, if found
         */

    }, {
        key: 'get',
        value: function get(modelName) {
            var found = (0, _find2.default)(this.registry.concat(this.implicitThroughModels), function (model) {
                return model.modelName === modelName;
            });

            if (typeof found === 'undefined') {
                throw new Error('Did not find model ' + modelName + ' from registry.');
            }
            return found;
        }
    }, {
        key: 'getModelClasses',
        value: function getModelClasses() {
            this._setupModelPrototypes(this.registry);
            this._setupModelPrototypes(this.implicitThroughModels);
            return this.registry.concat(this.implicitThroughModels);
        }
    }, {
        key: 'generateSchemaSpec',
        value: function generateSchemaSpec() {
            var models = this.getModelClasses();
            var tables = models.reduce(function (spec, modelClass) {
                var tableName = modelClass.modelName;
                var tableSpec = modelClass._getTableOpts(); // eslint-disable-line no-underscore-dangle
                spec[tableName] = (0, _assign2.default)({}, { fields: modelClass.fields }, tableSpec);
                return spec;
            }, {});
            return { tables: tables };
        }
    }, {
        key: 'getDatabase',
        value: function getDatabase() {
            if (!this.db) {
                this.db = this.createDatabase(this.generateSchemaSpec());
            }
            return this.db;
        }

        /**
         * Returns the empty database state.
         * @return {Object} the empty state
         */

    }, {
        key: 'getEmptyState',
        value: function getEmptyState() {
            return this.getDatabase().getEmptyState();
        }

        /**
         * Begins an immutable database session.
         *
         * @param  {Object} state  - the state the database manages
         * @return {Session} a new {@link Session} instance
         */

    }, {
        key: 'session',
        value: function session(state) {
            return new _Session2.default(this, this.getDatabase(), state);
        }

        /**
         * Begins a mutable database session.
         *
         * @param  {Object} state  - the state the database manages
         * @return {Session} a new {@link Session} instance
         */

    }, {
        key: 'mutableSession',
        value: function mutableSession(state) {
            return new _Session2.default(this, this.getDatabase(), state, true);
        }

        /**
         * @private
         */

    }, {
        key: '_setupModelPrototypes',
        value: function _setupModelPrototypes(models) {
            var _this5 = this;

            models.forEach(function (model) {
                if (!model.isSetUp) {
                    var fields = model.fields,
                        modelName = model.modelName,
                        querySetClass = model.querySetClass;

                    (0, _forOwn2.default)(fields, function (field, fieldName) {
                        if (!_this5._isFieldInstalled(modelName, fieldName)) {
                            _this5._installField(field, fieldName, model);
                            _this5._setFieldInstalled(modelName, fieldName);
                        }
                    });
                    (0, _utils.attachQuerySetMethods)(model, querySetClass);
                    model.isSetUp = true;
                }
            });
        }

        /**
         * @private
         */

    }, {
        key: '_isFieldInstalled',
        value: function _isFieldInstalled(modelName, fieldName) {
            return this.installedFields.hasOwnProperty(modelName) ? !!this.installedFields[modelName][fieldName] : false;
        }

        /**
         * @private
         */

    }, {
        key: '_setFieldInstalled',
        value: function _setFieldInstalled(modelName, fieldName) {
            if (!this.installedFields.hasOwnProperty(modelName)) {
                this.installedFields[modelName] = {};
            }
            this.installedFields[modelName][fieldName] = true;
        }

        /**
         * Installs a field on a model and its related models if necessary.
         * @private
         */

    }, {
        key: '_installField',
        value: function _installField(field, fieldName, model) {
            var FieldInstaller = field.installerClass;
            new FieldInstaller({
                field: field,
                fieldName: fieldName,
                model: model,
                orm: this
            }).run();
        }

        // DEPRECATED AND REMOVED METHODS

        /**
         * @deprecated Use {@link ORM#mutableSession} instead.
         */

    }, {
        key: 'withMutations',
        value: function withMutations(state) {
            (0, _utils.warnDeprecated)('`ORM.prototype.withMutations` has been deprecated. ' + 'Use `ORM.prototype.mutableSession` instead.');
            return this.mutableSession(state);
        }

        /**
         * @deprecated Use {@link ORM#session} instead.
         */

    }, {
        key: 'from',
        value: function from(state) {
            (0, _utils.warnDeprecated)('`ORM.prototype.from` has been deprecated. ' + 'Use `ORM.prototype.session` instead.');
            return this.session(state);
        }

        /**
         * @deprecated Access {@link Session#state} instead.
         */

    }, {
        key: 'reducer',
        value: function reducer() {
            (0, _utils.warnDeprecated)('`ORM.prototype.reducer` has been deprecated. Access ' + 'the `Session.prototype.state` property instead.');
            return (0, _redux.createReducer)(this);
        }

        /**
         * @deprecated Use `import { createSelector } from "redux-orm"` instead.
         */

    }, {
        key: 'createSelector',
        value: function createSelector() {
            (0, _utils.warnDeprecated)('`ORM.prototype.createSelector` has been deprecated. ' + 'Import `createSelector` from Redux-ORM instead.');

            for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                args[_key2] = arguments[_key2];
            }

            return _redux.createSelector.apply(undefined, [this].concat(args));
        }

        /**
         * @deprecated Use {@link ORM#getEmptyState} instead.
         */

    }, {
        key: 'getDefaultState',
        value: function getDefaultState() {
            (0, _utils.warnDeprecated)('`ORM.prototype.getDefaultState` has been deprecated. Use ' + '`ORM.prototype.getEmptyState` instead.');
            return this.getEmptyState();
        }

        /**
         * @deprecated Define a Model class instead.
         */

    }, {
        key: 'define',
        value: function define() {
            throw new Error('`ORM.prototype.define` has been removed. Please define a Model class.');
        }
    }]);
    return ORM;
}();

function DeprecatedSchema() {
    throw new Error('Schema has been renamed to ORM. Please import ORM instead of Schema ' + 'from Redux-ORM.');
}

exports.default = ORM;