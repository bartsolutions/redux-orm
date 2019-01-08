'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _mapValues = require('lodash/mapValues');

var _mapValues2 = _interopRequireDefault(_mapValues);

var _utils = require('./utils');

var _constants = require('./constants');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * This class is used to build and make queries to the database
 * and operating the resulting set (such as updating attributes
 * or deleting the records).
 *
 * The queries are built lazily. For example:
 *
 * ```javascript
 * const qs = Book.all()
 *     .filter(book => book.releaseYear > 1999)
 *     .orderBy('name');
 * ```
 *
 * Doesn't execute a query. The query is executed only when
 * you need information from the query result, such as {@link QuerySet#count},
 * {@link QuerySet#toRefArray}. After the query is executed, the resulting
 * set is cached in the QuerySet instance.
 *
 * QuerySet instances also return copies, so chaining filters doesn't
 * mutate the previous instances.
 */
var QuerySet = function () {
    /**
     * Creates a QuerySet. The constructor is mainly for internal use;
     * You should access QuerySet instances from {@link Model}.
     *
     * @param  {Model} modelClass - the model class of objects in this QuerySet.
     * @param  {any[]} clauses - query clauses needed to evaluate the set.
     * @param {Object} [opts] - additional options
     */
    function QuerySet(modelClass, clauses, opts) {
        (0, _classCallCheck3.default)(this, QuerySet);

        (0, _assign2.default)(this, {
            modelClass: modelClass,
            clauses: clauses || []
        });

        this._opts = opts;
    }

    (0, _createClass3.default)(QuerySet, [{
        key: '_new',
        value: function _new(clauses, userOpts) {
            var opts = (0, _assign2.default)({}, this._opts, userOpts);
            return new this.constructor(this.modelClass, clauses, opts);
        }
    }, {
        key: 'toString',
        value: function toString() {
            var _this = this;

            this._evaluate();
            var contents = this.rows.map(function (_ref) {
                var id = _ref.id;
                return _this.modelClass.withId(id).toString();
            }).join('\n    - ');
            return 'QuerySet contents:\n    - ' + contents;
        }

        /**
         * Returns an array of the plain objects represented by the QuerySet.
         * The plain objects are direct references to the store.
         *
         * @return {Object[]} references to the plain JS objects represented by
         *                    the QuerySet
         */

    }, {
        key: 'toRefArray',
        value: function toRefArray() {
            return this._evaluate();
        }

        /**
         * Returns an array of {@link Model} instances represented by the QuerySet.
         * @return {Model[]} model instances represented by the QuerySet
         */

    }, {
        key: 'toModelArray',
        value: function toModelArray() {
            var ModelClass = this.modelClass;

            return this._evaluate().map(function (props) {
                return new ModelClass(props);
            });
        }

        /**
         * Returns the number of {@link Model} instances represented by the QuerySet.
         *
         * @return {number} length of the QuerySet
         */

    }, {
        key: 'count',
        value: function count() {
            this._evaluate();
            return this.rows.length;
        }

        /**
         * Checks if the {@link QuerySet} instance has any records matching the query
         * in the database.
         *
         * @return {Boolean} `true` if the {@link QuerySet} instance contains entities, else `false`.
         */

    }, {
        key: 'exists',
        value: function exists() {
            return Boolean(this.count());
        }

        /**
         * Returns the {@link Model} instance at index `index` in the {@link QuerySet} instance if
         * `withRefs` flag is set to `false`, or a reference to the plain JavaScript
         * object in the model state if `true`.
         *
         * @param  {number} index - index of the model instance to get
         * @return {Model|undefined} a {@link Model} instance at index
         *                           `index` in the {@link QuerySet} instance,
         *                           or undefined if the index is out of bounds.
         */

    }, {
        key: 'at',
        value: function at(index) {
            var ModelClass = this.modelClass;


            var rows = this._evaluate();
            if (index >= 0 && index < rows.length) {
                return new ModelClass(rows[index]);
            }

            return undefined;
        }

        /**
         * Returns the {@link Model} instance at index 0 in the {@link QuerySet} instance.
         * @return {Model}
         */

    }, {
        key: 'first',
        value: function first() {
            return this.at(0);
        }

        /**
         * Returns the {@link Model} instance at index `QuerySet.count() - 1`
         * @return {Model}
         */

    }, {
        key: 'last',
        value: function last() {
            var rows = this._evaluate();
            return this.at(rows.length - 1);
        }

        /**
         * Returns a new {@link QuerySet} instance with the same entities.
         * @return {QuerySet} a new QuerySet with the same entities.
         */

    }, {
        key: 'all',
        value: function all() {
            return this._new(this.clauses);
        }

        /**
         * Returns a new {@link QuerySet} instance with entities that match properties in `lookupObj`.
         *
         * @param  {Object} lookupObj - the properties to match objects with. Can also be a function.
         * @return {QuerySet} a new {@link QuerySet} instance with objects that passed the filter.
         */

    }, {
        key: 'filter',
        value: function filter(lookupObj) {
            /**
             * allow foreign keys to be specified as model instances,
             * transform model instances to their primary keys
             */
            var normalizedLookupObj = (typeof lookupObj === 'undefined' ? 'undefined' : (0, _typeof3.default)(lookupObj)) === 'object' ? (0, _mapValues2.default)(lookupObj, _utils.normalizeEntity) : lookupObj;

            var filterDescriptor = {
                type: _constants.FILTER,
                payload: normalizedLookupObj
            };
            /**
             * create a new QuerySet
             * including only rows matching the lookupObj
             */
            return this._new(this.clauses.concat(filterDescriptor));
        }

        /**
         * Returns a new {@link QuerySet} instance with entities that do not match
         * properties in `lookupObj`.
         *
         * @param  {Object} lookupObj - the properties to unmatch objects with. Can also be a function.
         * @return {QuerySet} a new {@link QuerySet} instance with objects that did not pass the filter.
         */

    }, {
        key: 'exclude',
        value: function exclude(lookupObj) {
            /**
             * allow foreign keys to be specified as model instances,
             * transform model instances to their primary keys
             */
            var normalizedLookupObj = (typeof lookupObj === 'undefined' ? 'undefined' : (0, _typeof3.default)(lookupObj)) === 'object' ? (0, _mapValues2.default)(lookupObj, _utils.normalizeEntity) : lookupObj;
            var excludeDescriptor = {
                type: _constants.EXCLUDE,
                payload: normalizedLookupObj
            };

            /**
             * create a new QuerySet
             * excluding all rows matching the lookupObj
             */
            return this._new(this.clauses.concat(excludeDescriptor));
        }

        /**
         * Performs the actual database query.
         * @private
         * @return {Array} rows corresponding to the QuerySet's clauses
         */

    }, {
        key: '_evaluate',
        value: function _evaluate() {
            if (typeof this.modelClass.session === 'undefined') {
                throw new Error(['Tried to query the ' + this.modelClass.modelName + ' model\'s table without a session. ', 'Create a session using `session = orm.session()` and use ', '`session["' + this.modelClass.modelName + '"]` for querying instead.'].join(''));
            }
            if (!this._evaluated) {
                var _modelClass = this.modelClass,
                    session = _modelClass.session,
                    table = _modelClass.modelName;

                var querySpec = {
                    table: table,
                    clauses: this.clauses
                };
                this.rows = session.query(querySpec).rows;
                this._evaluated = true;
            }
            return this.rows;
        }

        /**
         * Returns a new {@link QuerySet} instance with entities ordered by `iteratees` in ascending
         * order, unless otherwise specified. Delegates to `lodash.orderBy`.
         *
         * @param  {string[]|Function[]} iteratees - an array where each item can be a string or a
         *                                           function. If a string is supplied, it should
         *                                           correspond to property on the entity that will
         *                                           determine the order. If a function is supplied,
         *                                           it should return the value to order by.
         * @param {Boolean[]} [orders] - the sort orders of `iteratees`. If unspecified, all iteratees
         *                               will be sorted in ascending order. `true` and `'asc'`
         *                               correspond to ascending order, and `false` and `'desc`
         *                               to descending order.
         * @return {QuerySet} a new {@link QuerySet} with objects ordered by `iteratees`.
         */

    }, {
        key: 'orderBy',
        value: function orderBy(iteratees, orders) {
            var orderByDescriptor = {
                type: _constants.ORDER_BY,
                payload: [iteratees, orders]
            };

            /**
             * create a new QuerySet
             * sorting all rows according to the passed arguments
             */
            return this._new(this.clauses.concat(orderByDescriptor));
        }

        /**
         * Records an update specified with `mergeObj` to all the objects
         * in the {@link QuerySet} instance.
         *
         * @param  {Object} mergeObj - an object to merge with all the objects in this
         *                             queryset.
         * @return {undefined}
         */

    }, {
        key: 'update',
        value: function update(mergeObj) {
            var _modelClass2 = this.modelClass,
                session = _modelClass2.session,
                table = _modelClass2.modelName;


            session.applyUpdate({
                action: _constants.UPDATE,
                query: {
                    table: table,
                    clauses: this.clauses
                },
                payload: mergeObj
            });

            this._evaluated = false;
        }

        /**
         * Records a deletion of all the objects in this {@link QuerySet} instance.
         * @return {undefined}
         */

    }, {
        key: 'delete',
        value: function _delete() {
            var _modelClass3 = this.modelClass,
                session = _modelClass3.session,
                table = _modelClass3.modelName;


            this.toModelArray().forEach(function (model) {
                return model._onDelete();
            } // eslint-disable-line no-underscore-dangle
            );

            session.applyUpdate({
                action: _constants.DELETE,
                query: {
                    table: table,
                    clauses: this.clauses
                }
            });

            this._evaluated = false;
        }

        // DEPRECATED AND REMOVED METHODS

        /**
         * @deprecated
         * Use {@link QuerySet#toModelArray} or predicate functions that
         * instantiate Models from refs, e.g. `new Model(ref)`.
         */

    }, {
        key: 'map',


        /**
         * @deprecated
         * Call {@link QuerySet#toModelArray} or {@link QuerySet#toRefArray} first to map.
         */
        value: function map() {
            throw new Error('`QuerySet.prototype.map` has been removed. ' + 'Call `.toModelArray()` or `.toRefArray()` first to map.');
        }

        /**
         * @deprecated
         * Call {@link QuerySet#toModelArray} or {@link QuerySet#toRefArray} first to iterate.
         */

    }, {
        key: 'forEach',
        value: function forEach() {
            throw new Error('`QuerySet.prototype.forEach` has been removed. ' + 'Call `.toModelArray()` or `.toRefArray()` first to iterate.');
        }
    }, {
        key: 'withModels',
        get: function get() {
            throw new Error('`QuerySet.prototype.withModels` has been removed. ' + 'Use `.toModelArray()` or predicate functions that ' + 'instantiate Models from refs, e.g. `new Model(ref)`.');
        }

        /**
         * @deprecated Query building operates on refs only now.
         */

    }, {
        key: 'withRefs',
        get: function get() {
            (0, _utils.warnDeprecated)('`QuerySet.prototype.withRefs` has been deprecated. ' + 'Query building operates on refs only now.');
            return undefined;
        }
    }], [{
        key: 'addSharedMethod',
        value: function addSharedMethod(methodName) {
            this.sharedMethods = this.sharedMethods.concat(methodName);
        }
    }]);
    return QuerySet;
}();

QuerySet.sharedMethods = ['count', 'at', 'all', 'last', 'first', 'filter', 'exclude', 'orderBy', 'update', 'delete'];

exports.default = QuerySet;