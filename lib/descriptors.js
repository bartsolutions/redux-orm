'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.manyToManyDescriptor = exports.backwardsManyToOneDescriptor = exports.backwardsOneToOneDescriptor = exports.forwardsOneToOneDescriptor = exports.forwardsManyToOneDescriptor = exports.attrDescriptor = undefined;

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * The functions in this file return custom JS property descriptors
 * that are supposed to be assigned to Model fields.
 *
 * Some include the logic to look up models using foreign keys and
 * to add or remove relationships between models.
 *
 * @module descriptors
 */

/**
 * Defines a basic non-key attribute.
 * @param  {string} fieldName - the name of the field the descriptor will be assigned to.
 */
function attrDescriptor(fieldName) {
    return {
        get: function get() {
            return this._fields[fieldName];
        },
        set: function set(value) {
            return this.set(fieldName, value);
        },


        enumerable: true,
        configurable: true
    };
}

/**
 * Forwards direction of a Foreign Key: returns one object.
 * Also works as {@link .forwardsOneToOneDescriptor|forwardsOneToOneDescriptor}.
 *
 * For `book.author` referencing an `Author` model instance,
 * `fieldName` would be `'author'` and `declaredToModelName` would be `'Author'`.
 * @param  {string} fieldName - the name of the field the descriptor will be assigned to.
 * @param  {string} declaredToModelName - the name of the model that the field references.
 */
function forwardsManyToOneDescriptor(fieldName, declaredToModelName) {
    return {
        get: function get() {
            var _getClass = this.getClass(),
                DeclaredToModel = _getClass.session[declaredToModelName];

            var toId = this._fields[fieldName];


            return DeclaredToModel.withId(toId);
        },
        set: function set(value) {
            this.update((0, _defineProperty3.default)({}, fieldName, (0, _utils.normalizeEntity)(value)));
        }
    };
}

/**
 * Dereferencing foreign keys in {@link module:fields.oneToOne|oneToOne}
 * relationships works the same way as in many-to-one relationships:
 * just look up the related model.
 *
 * For example, a human face tends to have a single nose.
 * So if we want to resolve `face.nose`, we need to
 * look up the `Nose` that has the primary key that `face` references.
 *
 * @see {@link module:descriptors~forwardsManyToOneDescriptor|forwardsManyToOneDescriptor}
 */
function forwardsOneToOneDescriptor() {
    return forwardsManyToOneDescriptor.apply(undefined, arguments);
}

/**
 * Here we resolve 1-to-1 relationships starting at the model on which the
 * field was not installed. This means we need to find the instance of the
 * other model whose {@link module:fields.oneToOne|oneToOne} FK field contains the current model's primary key.
 *
 * @param  {string} declaredFieldName - the name of the field referencing the current model.
 * @param  {string} declaredFromModelName - the name of the other model.
 */
function backwardsOneToOneDescriptor(declaredFieldName, declaredFromModelName) {
    return {
        get: function get() {
            var _getClass2 = this.getClass(),
                DeclaredFromModel = _getClass2.session[declaredFromModelName];

            return DeclaredFromModel.get((0, _defineProperty3.default)({}, declaredFieldName, this.getId()));
        },
        set: function set() {
            throw new Error('Can\'t mutate a reverse one-to-one relation.');
        }
    };
}

/**
 * The backwards direction of a n-to-1 relationship (i.e. 1-to-n),
 * meaning this will return an a collection (`QuerySet`) of model instances.
 *
 * An example would be `author.books` referencing all instances of
 * the `Book` model that reference the author using `fk()`.
 */
function backwardsManyToOneDescriptor(declaredFieldName, declaredFromModelName) {
    return {
        get: function get() {
            var _getClass3 = this.getClass(),
                DeclaredFromModel = _getClass3.session[declaredFromModelName];

            return DeclaredFromModel.filter((0, _defineProperty3.default)({}, declaredFieldName, this.getId()));
        },
        set: function set() {
            throw new Error('Can\'t mutate a reverse many-to-one relation.');
        }
    };
}

/**
 * This descriptor is assigned to both sides of a many-to-many relationship.
 * To indicate the backwards direction pass `true` for `reverse`.
 */
function manyToManyDescriptor(declaredFromModelName, declaredToModelName, throughModelName, throughFields, reverse) {
    return {
        get: function get() {
            var _getClass4 = this.getClass(),
                _getClass4$session = _getClass4.session,
                DeclaredFromModel = _getClass4$session[declaredFromModelName],
                DeclaredToModel = _getClass4$session[declaredToModelName],
                ThroughModel = _getClass4$session[throughModelName];

            var ThisModel = reverse ? DeclaredToModel : DeclaredFromModel;
            var OtherModel = reverse ? DeclaredFromModel : DeclaredToModel;

            var thisReferencingField = reverse ? throughFields.to : throughFields.from;
            var otherReferencingField = reverse ? throughFields.from : throughFields.to;

            var thisId = this.getId();

            var throughQs = ThroughModel.filter((0, _defineProperty3.default)({}, thisReferencingField, thisId));

            /**
             * all IDs of instances of the other model that are
             * referenced by any instance of the current model
             */
            var referencedOtherIds = new _set2.default(throughQs.toRefArray().map(function (obj) {
                return obj[otherReferencingField];
            }));

            /**
             * selects all instances of other model that are referenced
             * by any instance of the current model
             */
            var qs = OtherModel.filter(function (otherModelInstance) {
                return referencedOtherIds.has(otherModelInstance[OtherModel.idAttribute]);
            });

            /**
             * Allows adding OtherModel instances to be referenced by the current instance.
             *
             * E.g. Book.first().authors.add(1, 2) would add the authors with IDs 1 and 2
             * to the first book's list of referenced authors.
             *
             * @return undefined
             */
            qs.add = function add() {
                for (var _len = arguments.length, entities = Array(_len), _key = 0; _key < _len; _key++) {
                    entities[_key] = arguments[_key];
                }

                var idsToAdd = new _set2.default(entities.map(_utils.normalizeEntity));

                var existingQs = throughQs.filter(function (through) {
                    return idsToAdd.has(through[otherReferencingField]);
                });

                if (existingQs.exists()) {
                    var existingIds = existingQs.toRefArray().map(function (through) {
                        return through[otherReferencingField];
                    });

                    throw new Error('Tried to add already existing ' + OtherModel.modelName + ' id(s) ' + existingIds + ' to the ' + ThisModel.modelName + ' instance with id ' + thisId);
                }

                idsToAdd.forEach(function (id) {
                    var _ThroughModel$create;

                    return ThroughModel.create((_ThroughModel$create = {}, (0, _defineProperty3.default)(_ThroughModel$create, otherReferencingField, id), (0, _defineProperty3.default)(_ThroughModel$create, thisReferencingField, thisId), _ThroughModel$create));
                });
            };

            /**
             * Removes references to all OtherModel instances from the current model.
             *
             * E.g. Book.first().authors.clear() would cause the first book's list
             * of referenced authors to become empty.
             *
             * @return undefined
             */
            qs.clear = function clear() {
                throughQs.delete();
            };

            /**
             * Removes references to all passed OtherModel instances from the current model.
             *
             * E.g. Book.first().authors.remove(1, 2) would cause the authors with
             * IDs 1 and 2 to no longer be referenced by the first book.
             *
             * @return undefined
             */
            qs.remove = function remove() {
                for (var _len2 = arguments.length, entities = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                    entities[_key2] = arguments[_key2];
                }

                var idsToRemove = new _set2.default(entities.map(_utils.normalizeEntity));

                var entitiesToDelete = throughQs.filter(function (through) {
                    return idsToRemove.has(through[otherReferencingField]);
                });

                if (entitiesToDelete.count() !== idsToRemove.size) {
                    // Tried deleting non-existing entities.
                    var entitiesToDeleteIds = entitiesToDelete.toRefArray().map(function (through) {
                        return through[otherReferencingField];
                    });

                    var unexistingIds = [].concat((0, _toConsumableArray3.default)(idsToRemove)).filter(function (id) {
                        return !(0, _utils.includes)(entitiesToDeleteIds, id);
                    });

                    throw new Error('Tried to delete non-existing ' + OtherModel.modelName + ' id(s) ' + unexistingIds + ' from the ' + ThisModel.modelName + ' instance with id ' + thisId);
                }

                entitiesToDelete.delete();
            };

            return qs;
        },
        set: function set() {
            throw new Error('Tried setting a M2M field. Please use the related QuerySet methods add, remove and clear.');
        }
    };
}

exports.attrDescriptor = attrDescriptor;
exports.forwardsManyToOneDescriptor = forwardsManyToOneDescriptor;
exports.forwardsOneToOneDescriptor = forwardsOneToOneDescriptor;
exports.backwardsOneToOneDescriptor = backwardsOneToOneDescriptor;
exports.backwardsManyToOneDescriptor = backwardsManyToOneDescriptor;
exports.manyToManyDescriptor = manyToManyDescriptor;