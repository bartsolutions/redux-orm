'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.OneToOne = exports.ManyToMany = exports.ForeignKey = exports.Attribute = undefined;

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _getOwnPropertyDescriptor = require('babel-runtime/core-js/object/get-own-property-descriptor');

var _getOwnPropertyDescriptor2 = _interopRequireDefault(_getOwnPropertyDescriptor);

var _defineProperty = require('babel-runtime/core-js/object/define-property');

var _defineProperty2 = _interopRequireDefault(_defineProperty);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

exports.attr = attr;
exports.fk = fk;
exports.many = many;
exports.oneToOne = oneToOne;

var _findKey = require('lodash/findKey');

var _findKey2 = _interopRequireDefault(_findKey);

var _descriptors = require('./descriptors');

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Contains the logic for how fields on {@link Model}s work
 * and which descriptors must be installed.
 *
 * If your goal is to define fields on a Model class,
 * please use the more convenient methods {@link attr},
 * {@link fk}, {@link many} and {@link oneToOne}.
 *
 * @module fields
 */

/**
 * Defines algorithm for installing a field onto a model and related models.
 * Conforms to the template method behavioral design pattern.
 * @private
 */
var FieldInstallerTemplate = function () {
    function FieldInstallerTemplate(opts) {
        (0, _classCallCheck3.default)(this, FieldInstallerTemplate);

        this.field = opts.field;
        this.fieldName = opts.fieldName;
        this.model = opts.model;
        this.orm = opts.orm;
        /**
         * the field itself has no knowledge of the model
         * it is being installed upon; we need to inform it
         * that it is a self-referencing field for the field
         * to be able to make better informed decisions
         */
        if (this.field.references(this.model)) {
            this.field.toModelName = 'this';
        }
    }

    (0, _createClass3.default)(FieldInstallerTemplate, [{
        key: 'run',
        value: function run() {
            if (this.field.installsForwardsDescriptor) {
                this.installForwardsDescriptor();
            }
            if (this.field.installsForwardsVirtualField) {
                this.installForwardsVirtualField();
            }
            /**
             * Install a backwards field on a model as a consequence
             * of having installed the forwards field on another model.
             */
            if (this.field.installsBackwardsDescriptor) {
                this.installBackwardsDescriptor();
            }
            if (this.field.installsBackwardsVirtualField) {
                this.installBackwardsVirtualField();
            }
        }
    }, {
        key: 'toModel',
        get: function get() {
            if (typeof this._toModel === 'undefined') {
                var toModelName = this.field.toModelName;

                if (!toModelName) {
                    this._toModel = null;
                } else if (toModelName === 'this') {
                    this._toModel = this.model;
                } else {
                    this._toModel = this.orm.get(toModelName);
                }
            }
            return this._toModel;
        }
    }, {
        key: 'throughModel',
        get: function get() {
            if (typeof this._throughModel === 'undefined') {
                var throughModelName = this.field.getThroughModelName(this.fieldName, this.model);
                if (!throughModelName) {
                    this._throughModel = null;
                } else {
                    this._throughModel = this.orm.get(throughModelName);
                }
            }
            return this._throughModel;
        }
    }, {
        key: 'backwardsFieldName',
        get: function get() {
            return this.field.getBackwardsFieldName(this.model);
        }
    }]);
    return FieldInstallerTemplate;
}();

/**
 * Default implementation for the template method in FieldInstallerTemplate.
 * @private
 */


var DefaultFieldInstaller = function (_FieldInstallerTempla) {
    (0, _inherits3.default)(DefaultFieldInstaller, _FieldInstallerTempla);

    function DefaultFieldInstaller() {
        (0, _classCallCheck3.default)(this, DefaultFieldInstaller);
        return (0, _possibleConstructorReturn3.default)(this, (DefaultFieldInstaller.__proto__ || (0, _getPrototypeOf2.default)(DefaultFieldInstaller)).apply(this, arguments));
    }

    (0, _createClass3.default)(DefaultFieldInstaller, [{
        key: 'installForwardsDescriptor',
        value: function installForwardsDescriptor() {
            (0, _defineProperty2.default)(this.model.prototype, this.fieldName, this.field.createForwardsDescriptor(this.fieldName, this.model, this.toModel, this.throughModel));
        }
    }, {
        key: 'installForwardsVirtualField',
        value: function installForwardsVirtualField() {
            this.model.virtualFields[this.fieldName] = this.field.createForwardsVirtualField(this.fieldName, this.model, this.toModel, this.throughModel);
        }
    }, {
        key: 'installBackwardsDescriptor',
        value: function installBackwardsDescriptor() {
            var backwardsDescriptor = (0, _getOwnPropertyDescriptor2.default)(this.toModel.prototype, this.backwardsFieldName);
            if (backwardsDescriptor) {
                throw new Error((0, _utils.reverseFieldErrorMessage)(this.model.modelName, this.fieldName, this.toModel.modelName, this.backwardsFieldName));
            }

            // install backwards descriptor
            (0, _defineProperty2.default)(this.toModel.prototype, this.backwardsFieldName, this.field.createBackwardsDescriptor(this.fieldName, this.model, this.toModel, this.throughModel));
        }
    }, {
        key: 'installBackwardsVirtualField',
        value: function installBackwardsVirtualField() {
            this.toModel.virtualFields[this.backwardsFieldName] = this.field.createBackwardsVirtualField(this.fieldName, this.model, this.toModel, this.throughModel);
        }
    }]);
    return DefaultFieldInstaller;
}(FieldInstallerTemplate);

/**
 * @ignore
 */


var Field = function () {
    function Field() {
        (0, _classCallCheck3.default)(this, Field);
    }

    (0, _createClass3.default)(Field, [{
        key: 'getClass',
        value: function getClass() {
            return this.constructor;
        }
    }, {
        key: 'references',
        value: function references(model) {
            return false;
        }
    }, {
        key: 'getThroughModelName',
        value: function getThroughModelName(fieldName, model) {
            return null;
        }
    }, {
        key: 'installerClass',
        get: function get() {
            return DefaultFieldInstaller;
        }
    }, {
        key: 'installsForwardsDescriptor',
        get: function get() {
            return true;
        }
    }, {
        key: 'installsForwardsVirtualField',
        get: function get() {
            return false;
        }
    }, {
        key: 'installsBackwardsDescriptor',
        get: function get() {
            return false;
        }
    }, {
        key: 'installsBackwardsVirtualField',
        get: function get() {
            return false;
        }
    }]);
    return Field;
}();

/**
 * @ignore
 */


var Attribute = exports.Attribute = function (_Field) {
    (0, _inherits3.default)(Attribute, _Field);

    function Attribute(opts) {
        (0, _classCallCheck3.default)(this, Attribute);

        var _this2 = (0, _possibleConstructorReturn3.default)(this, (Attribute.__proto__ || (0, _getPrototypeOf2.default)(Attribute)).call(this, opts));

        _this2.opts = opts || {};

        if (_this2.opts.hasOwnProperty('getDefault')) {
            _this2.getDefault = _this2.opts.getDefault;
        }
        return _this2;
    }

    (0, _createClass3.default)(Attribute, [{
        key: 'createForwardsDescriptor',
        value: function createForwardsDescriptor(fieldName, model) {
            return (0, _descriptors.attrDescriptor)(fieldName);
        }
    }]);
    return Attribute;
}(Field);

/**
 * @ignore
 */


var RelationalField = function (_Field2) {
    (0, _inherits3.default)(RelationalField, _Field2);

    function RelationalField() {
        var _ref;

        (0, _classCallCheck3.default)(this, RelationalField);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        var _this3 = (0, _possibleConstructorReturn3.default)(this, (_ref = RelationalField.__proto__ || (0, _getPrototypeOf2.default)(RelationalField)).call.apply(_ref, [this].concat(args)));

        if (args.length === 1 && (0, _typeof3.default)(args[0]) === 'object') {
            var opts = args[0];
            _this3.toModelName = opts.to;
            _this3.relatedName = opts.relatedName;
            _this3.through = opts.through;
            _this3.throughFields = opts.throughFields;
            _this3.as = opts.as;
        } else {
            _this3.toModelName = args[0];
            _this3.relatedName = args[1];
        }
        return _this3;
    }

    (0, _createClass3.default)(RelationalField, [{
        key: 'getBackwardsFieldName',
        value: function getBackwardsFieldName(model) {
            return this.relatedName || (0, _utils.reverseFieldName)(model.modelName);
        }
    }, {
        key: 'createBackwardsVirtualField',
        value: function createBackwardsVirtualField(fieldName, model, toModel, throughModel) {
            var ThisField = this.getClass();
            return new ThisField(model.modelName, fieldName);
        }
    }, {
        key: 'references',
        value: function references(model) {
            return this.toModelName === model.modelName;
        }
    }, {
        key: 'installsBackwardsVirtualField',
        get: function get() {
            return true;
        }
    }, {
        key: 'installsBackwardsDescriptor',
        get: function get() {
            return true;
        }
    }, {
        key: 'installerClass',
        get: function get() {
            return function (_DefaultFieldInstalle) {
                (0, _inherits3.default)(AliasedForwardsDescriptorInstaller, _DefaultFieldInstalle);

                function AliasedForwardsDescriptorInstaller() {
                    (0, _classCallCheck3.default)(this, AliasedForwardsDescriptorInstaller);
                    return (0, _possibleConstructorReturn3.default)(this, (AliasedForwardsDescriptorInstaller.__proto__ || (0, _getPrototypeOf2.default)(AliasedForwardsDescriptorInstaller)).apply(this, arguments));
                }

                (0, _createClass3.default)(AliasedForwardsDescriptorInstaller, [{
                    key: 'installForwardsDescriptor',
                    value: function installForwardsDescriptor() {
                        (0, _defineProperty2.default)(this.model.prototype, this.field.as || this.fieldName, // use supplied name if possible
                        this.field.createForwardsDescriptor(this.fieldName, this.model, this.toModel, this.throughModel));
                    }
                }]);
                return AliasedForwardsDescriptorInstaller;
            }(DefaultFieldInstaller);
        }
    }]);
    return RelationalField;
}(Field);

/**
 * @ignore
 */


var ForeignKey = exports.ForeignKey = function (_RelationalField) {
    (0, _inherits3.default)(ForeignKey, _RelationalField);

    function ForeignKey() {
        (0, _classCallCheck3.default)(this, ForeignKey);
        return (0, _possibleConstructorReturn3.default)(this, (ForeignKey.__proto__ || (0, _getPrototypeOf2.default)(ForeignKey)).apply(this, arguments));
    }

    (0, _createClass3.default)(ForeignKey, [{
        key: 'createForwardsDescriptor',
        value: function createForwardsDescriptor(fieldName, model, toModel, throughModel) {
            return (0, _descriptors.forwardsManyToOneDescriptor)(fieldName, toModel.modelName);
        }
    }, {
        key: 'createBackwardsDescriptor',
        value: function createBackwardsDescriptor(fieldName, model, toModel, throughModel) {
            return (0, _descriptors.backwardsManyToOneDescriptor)(fieldName, model.modelName);
        }
    }]);
    return ForeignKey;
}(RelationalField);

/**
 * @ignore
 */


var ManyToMany = exports.ManyToMany = function (_RelationalField2) {
    (0, _inherits3.default)(ManyToMany, _RelationalField2);

    function ManyToMany() {
        (0, _classCallCheck3.default)(this, ManyToMany);
        return (0, _possibleConstructorReturn3.default)(this, (ManyToMany.__proto__ || (0, _getPrototypeOf2.default)(ManyToMany)).apply(this, arguments));
    }

    (0, _createClass3.default)(ManyToMany, [{
        key: 'getDefault',
        value: function getDefault() {
            return [];
        }
    }, {
        key: 'getThroughModelName',
        value: function getThroughModelName(fieldName, model) {
            return this.through || (0, _utils.m2mName)(model.modelName, fieldName);
        }
    }, {
        key: 'createForwardsDescriptor',
        value: function createForwardsDescriptor(fieldName, model, toModel, throughModel) {
            return (0, _descriptors.manyToManyDescriptor)(model.modelName, toModel.modelName, throughModel.modelName, this.getThroughFields(fieldName, model, toModel, throughModel), false);
        }
    }, {
        key: 'createBackwardsDescriptor',
        value: function createBackwardsDescriptor(fieldName, model, toModel, throughModel) {
            return (0, _descriptors.manyToManyDescriptor)(model.modelName, toModel.modelName, throughModel.modelName, this.getThroughFields(fieldName, model, toModel, throughModel), true);
        }
    }, {
        key: 'createBackwardsVirtualField',
        value: function createBackwardsVirtualField(fieldName, model, toModel, throughModel) {
            var ThisField = this.getClass();
            return new ThisField({
                to: model.modelName,
                relatedName: fieldName,
                through: throughModel.modelName,
                throughFields: this.getThroughFields(fieldName, model, toModel, throughModel)
            });
        }
    }, {
        key: 'createForwardsVirtualField',
        value: function createForwardsVirtualField(fieldName, model, toModel, throughModel) {
            var ThisField = this.getClass();
            return new ThisField({
                to: toModel.modelName,
                relatedName: fieldName,
                through: this.through,
                throughFields: this.getThroughFields(fieldName, model, toModel, throughModel)
            });
        }
    }, {
        key: 'getThroughFields',
        value: function getThroughFields(fieldName, model, toModel, throughModel) {
            if (this.throughFields) {
                var _throughFields = (0, _slicedToArray3.default)(this.throughFields, 2),
                    fieldAName = _throughFields[0],
                    fieldBName = _throughFields[1];

                var fieldA = throughModel.fields[fieldAName];
                return {
                    to: fieldA.references(toModel) ? fieldAName : fieldBName,
                    from: fieldA.references(toModel) ? fieldBName : fieldAName
                };
            }

            if (model.modelName === toModel.modelName) {
                /**
                 * we have no way of determining the relationship's
                 * direction here, so we need to assume that the user
                 * did not use a custom through model
                 * see ORM#registerManyToManyModelsFor
                 */
                return {
                    to: (0, _utils.m2mToFieldName)(toModel.modelName),
                    from: (0, _utils.m2mFromFieldName)(model.modelName)
                };
            }

            /**
             * determine which field references which model
             * and infer the directions from that
             */
            var throughModelFieldReferencing = function throughModelFieldReferencing(otherModel) {
                return (0, _findKey2.default)(throughModel.fields, function (field) {
                    return field.references(otherModel);
                });
            };

            return {
                to: throughModelFieldReferencing(toModel),
                from: throughModelFieldReferencing(model)
            };
        }
    }, {
        key: 'installsForwardsVirtualField',
        get: function get() {
            return true;
        }
    }]);
    return ManyToMany;
}(RelationalField);

/**
 * @ignore
 */


var OneToOne = exports.OneToOne = function (_RelationalField3) {
    (0, _inherits3.default)(OneToOne, _RelationalField3);

    function OneToOne() {
        (0, _classCallCheck3.default)(this, OneToOne);
        return (0, _possibleConstructorReturn3.default)(this, (OneToOne.__proto__ || (0, _getPrototypeOf2.default)(OneToOne)).apply(this, arguments));
    }

    (0, _createClass3.default)(OneToOne, [{
        key: 'getBackwardsFieldName',
        value: function getBackwardsFieldName(model) {
            return this.relatedName || model.modelName.toLowerCase();
        }
    }, {
        key: 'createForwardsDescriptor',
        value: function createForwardsDescriptor(fieldName, model, toModel, throughModel) {
            return (0, _descriptors.forwardsOneToOneDescriptor)(fieldName, toModel.modelName);
        }
    }, {
        key: 'createBackwardsDescriptor',
        value: function createBackwardsDescriptor(fieldName, model, toModel, throughModel) {
            return (0, _descriptors.backwardsOneToOneDescriptor)(fieldName, model.modelName);
        }
    }]);
    return OneToOne;
}(RelationalField);

/**
 * Defines a value attribute on the model.
 * Though not required, it is recommended to define this for each non-foreign key you wish to use.
 * Getters and setters need to be defined on each Model
 * instantiation for undeclared data fields, which is slower.
 * You can use the optional `getDefault` parameter to fill in unpassed values
 * to {@link Model.create}, such as for generating ID's with UUID:
 *
 * ```javascript
 * import getUUID from 'your-uuid-package-of-choice';
 *
 * fields = {
 *   id: attr({ getDefault: () => getUUID() }),
 *   title: attr(),
 * }
 * ```
 *
 * @global
 *
 * @param  {Object} [opts]
 * @param {Function} [opts.getDefault] - if you give a function here, it's return
 *                                       value from calling with zero arguments will
 *                                       be used as the value when creating a new Model
 *                                       instance with {@link Model#create} if the field
 *                                       value is not passed.
 * @return {Attribute}
 */


function attr(opts) {
    return new Attribute(opts);
}

/**
 * Defines a foreign key on a model, which points
 * to a single entity on another model.
 *
 * You can pass arguments as either a single object,
 * or two arguments.
 *
 * If you pass two arguments, the first one is the name
 * of the Model the foreign key is pointing to, and
 * the second one is an optional related name, which will
 * be used to access the Model the foreign key
 * is being defined from, from the target Model.
 *
 * If the related name is not passed, it will be set as
 * `${toModelName}Set`.
 *
 * If you pass an object to `fk`, it has to be in the form
 *
 * ```javascript
 * fields = {
 *   author: fk({ to: 'Author', relatedName: 'books' })
 * }
 * ```
 *
 * Which is equal to
 *
 * ```javascript
 * fields = {
 *   author: fk('Author', 'books'),
 * }
 * ```
 *
 * @global
 *
 * @param  {string|Object} toModelNameOrObj - the `modelName` property of
 *                                            the Model that is the target of the
 *                                            foreign key, or an object with properties
 *                                            `to` and optionally `relatedName`.
 * @param {string} [relatedName] - if you didn't pass an object as the first argument,
 *                                 this is the property name that will be used to
 *                                 access a QuerySet the foreign key is defined from,
 *                                 from the target model.
 * @return {ForeignKey}
 */
function fk() {
    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
    }

    return new (Function.prototype.bind.apply(ForeignKey, [null].concat(args)))();
}

/**
 * Defines a many-to-many relationship between
 * this (source) and another (target) model.
 *
 * The relationship is modeled with an extra model called the through model.
 * The through model has foreign keys to both the source and target models.
 *
 * You can define your own through model if you want to associate more information
 * to the relationship. A custom through model must have at least two foreign keys,
 * one pointing to the source Model, and one pointing to the target Model.
 *
 * If you have more than one foreign key pointing to a source or target Model in the
 * through Model, you must pass the option `throughFields`, which is an array of two
 * strings, where the strings are the field names that identify the foreign keys to
 * be used for the many-to-many relationship. Redux-ORM will figure out which field name
 * points to which model by checking the through Model definition.
 *
 * Unlike `fk`, this function accepts only an object argument.
 *
 * ```javascript
 * class Authorship extends Model {}
 * Authorship.modelName = 'Authorship';
 * Authorship.fields = {
 *   author: fk('Author', 'authorships'),
 *   book: fk('Book', 'authorships'),
 * };
 *
 * class Author extends Model {}
 * Author.modelName = 'Author';
 * Author.fields = {
 *   books: many({
 *     to: 'Book',
 *     relatedName: 'authors',
 *     through: 'Authorship',
 *
 *     // this is optional, since Redux-ORM can figure
 *     // out the through fields itself as there aren't
 *     // multiple foreign keys pointing to the same models.
 *     throughFields: ['author', 'book'],
 *   })
 * };
 *
 * class Book extends Model {}
 * Book.modelName = 'Book';
 * ```
 *
 * You should only define the many-to-many relationship on one side. In the
 * above case of Authors to Books through Authorships, the relationship is
 * defined only on the Author model.
 *
 * @global
 *
 * @param  {Object} options - options
 * @param  {string} options.to - the `modelName` attribute of the target Model.
 * @param  {string} [options.through] - the `modelName` attribute of the through Model which
 *                                    must declare at least one foreign key to both source and
 *                                    target Models. If not supplied, Redux-Orm will autogenerate
 *                                    one.
 * @param  {string[]} [options.throughFields] - this must be supplied only when a custom through
 *                                            Model has more than one foreign key pointing to
 *                                            either the source or target mode. In this case
 *                                            Redux-ORM can't figure out the correct fields for
 *                                            you, you must provide them. The supplied array should
 *                                            have two elements that are the field names for the
 *                                            through fields you want to declare the many-to-many
 *                                            relationship with. The order doesn't matter;
 *                                            Redux-ORM will figure out which field points to
 *                                            the source Model and which to the target Model.
 * @param  {string} [options.relatedName] - the attribute used to access a QuerySet
 *                                          of source Models from target Model.
 * @return {ManyToMany}
 */
function many() {
    for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
    }

    return new (Function.prototype.bind.apply(ManyToMany, [null].concat(args)))();
}

/**
 * Defines a one-to-one relationship. In database terms, this is a foreign key with the
 * added restriction that only one entity can point to single target entity.
 *
 * The arguments are the same as with `fk`. If `relatedName` is not supplied,
 * the source model name in lowercase will be used. Note that with the one-to-one
 * relationship, the `relatedName` should be in singular, not plural.
 *
 * @global
 *
 * @param  {string|Object} toModelNameOrObj - the `modelName` property of
 *                                            the Model that is the target of the
 *                                            foreign key, or an object with properties
 *                                            `to` and optionally `relatedName`.
 * @param {string} [relatedName] - if you didn't pass an object as the first argument,
 *                                 this is the property name that will be used to
 *                                 access a Model the foreign key is defined from,
 *                                 from the target Model.
 * @return {OneToOne}
 */
function oneToOne() {
    for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        args[_key4] = arguments[_key4];
    }

    return new (Function.prototype.bind.apply(OneToOne, [null].concat(args)))();
}