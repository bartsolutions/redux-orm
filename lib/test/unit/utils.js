'use strict';

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _utils = require('../../utils');

var _constants = require('../../constants');

var _index = require('../../index');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('Utils', function () {
    describe('arrayDiffActions', function () {
        it('normal case', function () {
            var target = [2, 3];
            var source = [1, 2, 4];

            var actions = (0, _utils.arrayDiffActions)(source, target);
            expect(actions.add).toEqual([3]);
            expect(actions.delete).toEqual([1, 4]);
        });

        it('only add', function () {
            var target = [2, 3];
            var source = [2];

            var actions = (0, _utils.arrayDiffActions)(source, target);
            expect(actions.add).toEqual([3]);
            expect(actions.delete).toEqual([]);
        });

        it('only remove', function () {
            var target = [2, 3];
            var source = [2, 3, 4];

            var actions = (0, _utils.arrayDiffActions)(source, target);
            expect(actions.add).toEqual([]);
            expect(actions.delete).toEqual([4]);
        });

        it('identical', function () {
            var target = [2, 3];
            var source = [2, 3];

            var actions = (0, _utils.arrayDiffActions)(source, target);
            expect(actions).toBe(null);
        });
    });

    describe('warnDeprecated', function () {
        var consoleWarn = void 0;
        var consoleLog = void 0;
        beforeEach(function () {
            consoleWarn = {
                timesRun: 0,
                lastMessage: null
            };
            consoleLog = {
                timesRun: 0,
                lastMessage: null
            };
            console.warn = undefined;
            console.log = undefined;
        });

        it('calls console.warn if possible', function () {
            console.warn = function (msg) {
                consoleWarn.timesRun++;
                consoleWarn.lastMessage = msg;
            };
            expect(consoleWarn.timesRun).toBe(0);
            (0, _utils.warnDeprecated)('test consoleWarn');
            expect(consoleWarn.timesRun).toBe(1);
            expect(consoleWarn.lastMessage).toBe('test consoleWarn');
        });

        it('calls console.log if console.warn is not callable', function () {
            console.log = function (msg) {
                consoleLog.timesRun++;
                consoleLog.lastMessage = msg;
            };
            expect(consoleLog.timesRun).toBe(0);
            (0, _utils.warnDeprecated)('test consoleLog');
            expect(consoleLog.timesRun).toBe(1);
            expect(consoleLog.lastMessage).toBe('test consoleLog');
        });
    });

    describe('attachQuerySetMethods', function () {
        var Book = void 0;
        var defaultSharedMethods = ['count', 'at', 'all', 'last', 'first', 'filter', 'exclude', 'orderBy', 'update', 'delete'];
        beforeEach(function () {
            Book = function (_Model) {
                (0, _inherits3.default)(BookModel, _Model);

                function BookModel() {
                    (0, _classCallCheck3.default)(this, BookModel);
                    return (0, _possibleConstructorReturn3.default)(this, (BookModel.__proto__ || (0, _getPrototypeOf2.default)(BookModel)).apply(this, arguments));
                }

                return BookModel;
            }(_index.Model);
        });

        it('normal case', function () {
            (0, _utils.attachQuerySetMethods)(Book, Book.querySetClass);
            defaultSharedMethods.forEach(function (methodName) {
                expect((0, _typeof3.default)(Book[methodName])).toBe('function');
            });
        });

        it('custom QuerySet class without shared methods', function () {
            var CustomQuerySet = function (_QuerySet) {
                (0, _inherits3.default)(CustomQuerySet, _QuerySet);

                function CustomQuerySet() {
                    (0, _classCallCheck3.default)(this, CustomQuerySet);
                    return (0, _possibleConstructorReturn3.default)(this, (CustomQuerySet.__proto__ || (0, _getPrototypeOf2.default)(CustomQuerySet)).apply(this, arguments));
                }

                return CustomQuerySet;
            }(_index.QuerySet);

            CustomQuerySet.sharedMethods = [];
            Book.querySetClass = CustomQuerySet;

            (0, _utils.attachQuerySetMethods)(Book, Book.querySetClass);

            defaultSharedMethods.forEach(function (methodName) {
                if (['all'].includes(methodName)) return;
                expect(Book[methodName]).toBe(undefined);
            });
        });

        it('custom QuerySet class with overridden shared methods', function () {
            var CustomQuerySet = function (_QuerySet2) {
                (0, _inherits3.default)(CustomQuerySet, _QuerySet2);

                function CustomQuerySet() {
                    (0, _classCallCheck3.default)(this, CustomQuerySet);
                    return (0, _possibleConstructorReturn3.default)(this, (CustomQuerySet.__proto__ || (0, _getPrototypeOf2.default)(CustomQuerySet)).apply(this, arguments));
                }

                (0, _createClass3.default)(CustomQuerySet, [{
                    key: 'count',
                    value: function count() {
                        // eslint-disable-line class-methods-use-this
                        return 'some value';
                    }
                }]);
                return CustomQuerySet;
            }(_index.QuerySet);

            Book.querySetClass = CustomQuerySet;

            (0, _utils.attachQuerySetMethods)(Book, Book.querySetClass);

            expect(Book.count()).toBe('some value');
        });

        it('custom QuerySet class with getters as shared methods', function () {
            var CustomQuerySet = function (_QuerySet3) {
                (0, _inherits3.default)(CustomQuerySet, _QuerySet3);

                function CustomQuerySet() {
                    (0, _classCallCheck3.default)(this, CustomQuerySet);
                    return (0, _possibleConstructorReturn3.default)(this, (CustomQuerySet.__proto__ || (0, _getPrototypeOf2.default)(CustomQuerySet)).apply(this, arguments));
                }

                (0, _createClass3.default)(CustomQuerySet, [{
                    key: 'something',
                    get: function get() {
                        // eslint-disable-line class-methods-use-this
                        return 'some value';
                    }
                }]);
                return CustomQuerySet;
            }(_index.QuerySet);

            CustomQuerySet.sharedMethods = ['something'];
            Book.querySetClass = CustomQuerySet;

            (0, _utils.attachQuerySetMethods)(Book, Book.querySetClass);

            expect(Book.something).toBe('some value');
        });
    });

    describe('m2mName', function () {
        it('returns combined string', function () {
            expect((0, _utils.m2mName)('', '')).toBe('');
            expect((0, _utils.m2mName)('ModelA', '')).toBe('ModelA');
            expect((0, _utils.m2mName)('Author', 'books')).toBe('AuthorBooks');
            expect((0, _utils.m2mName)('mOVIE', 'Actors')).toBe('mOVIEActors');
        });
    });

    describe('m2mFromFieldName', function () {
        it('returns combined string', function () {
            expect((0, _utils.m2mFromFieldName)('')).toBe('fromId');
            expect((0, _utils.m2mFromFieldName)('ModelA')).toBe('fromModelAId');
            expect((0, _utils.m2mFromFieldName)('Author')).toBe('fromAuthorId');
            expect((0, _utils.m2mFromFieldName)('mOVIE')).toBe('frommOVIEId');
        });
    });

    describe('m2mToFieldName', function () {
        it('returns combined string', function () {
            expect((0, _utils.m2mToFieldName)('')).toBe('toId');
            expect((0, _utils.m2mToFieldName)('ModelA')).toBe('toModelAId');
            expect((0, _utils.m2mToFieldName)('Author')).toBe('toAuthorId');
            expect((0, _utils.m2mToFieldName)('mOVIE')).toBe('tomOVIEId');
        });
    });

    describe('reverseFieldName', function () {
        it('returns combined string', function () {
            expect((0, _utils.reverseFieldName)('')).toBe('Set');
            expect((0, _utils.reverseFieldName)('ModelA')).toBe('modelaSet');
            expect((0, _utils.reverseFieldName)('Author')).toBe('authorSet');
            expect((0, _utils.reverseFieldName)('mOVIE')).toBe('movieSet');
        });
    });

    describe('normalizeEntity', function () {
        var Book = void 0;
        beforeEach(function () {
            Book = function (_Model2) {
                (0, _inherits3.default)(BookModel, _Model2);

                function BookModel() {
                    (0, _classCallCheck3.default)(this, BookModel);
                    return (0, _possibleConstructorReturn3.default)(this, (BookModel.__proto__ || (0, _getPrototypeOf2.default)(BookModel)).apply(this, arguments));
                }

                (0, _createClass3.default)(BookModel, null, [{
                    key: 'idAttribute',
                    get: function get() {
                        return 'title';
                    }
                }]);
                return BookModel;
            }(_index.Model);
        });

        it('returns id of model instances', function () {
            var book = new Book({ title: 'book title' });
            expect((0, _utils.normalizeEntity)(book)).toBe('book title');
        });

        it('does not modify other values', function () {
            expect((0, _utils.normalizeEntity)(null)).toBe(null);
            expect((0, _utils.normalizeEntity)(undefined)).toBe(undefined);
            expect((0, _utils.normalizeEntity)(123)).toBe(123);
            expect((0, _utils.normalizeEntity)('some string')).toBe('some string');
            expect((0, _utils.normalizeEntity)({})).toEqual({});
            expect((0, _utils.normalizeEntity)([])).toEqual([]);
        });
    });

    describe('objectShallowEquals', function () {
        it('normal case', function () {
            expect((0, _utils.objectShallowEquals)({}, {})).toBe(true);
            expect((0, _utils.objectShallowEquals)({
                someAttribute: 'someValue'
            }, {
                someAttribute: 'someValue'
            })).toBe(true);
            expect((0, _utils.objectShallowEquals)({
                someAttribute: 'someValue',
                secondAttribute: 'secondValue'
            }, {
                someAttribute: 'otherValue'
            })).toBe(false);
            expect((0, _utils.objectShallowEquals)({
                someAttribute: 'someValue'
            }, {
                someAttribute: 'otherValue'
            })).toBe(false);
        });
        it('false for equal array keys', function () {
            // the arrays are referentially unequal
            expect((0, _utils.objectShallowEquals)({
                someAttribute: []
            }, {
                someAttribute: []
            })).toBe(false);
        });
        it('false for equal object keys', function () {
            // the objects are referentially unequal
            expect((0, _utils.objectShallowEquals)({
                someAttribute: {}
            }, {
                someAttribute: {}
            })).toBe(false);
        });
    });

    describe('clauseFiltersByAttribute', function () {
        it('normal case', function () {
            expect((0, _utils.clauseFiltersByAttribute)({
                type: _constants.FILTER,
                payload: {
                    someAttribute: 'someValue'
                }
            }, 'someAttribute')).toBe(true);
        });

        it('false if type is not filter', function () {
            expect((0, _utils.clauseFiltersByAttribute)({})).toBe(false);
            expect((0, _utils.clauseFiltersByAttribute)({}, '')).toBe(false);
            expect((0, _utils.clauseFiltersByAttribute)({ type: 'not filter' }, '')).toBe(false);
            expect((0, _utils.clauseFiltersByAttribute)({
                type: 'not filter',
                payload: {
                    someAttribute: 'someValue'
                }
            }, 'someAttribute')).toBe(false);
        });

        it('false if attribute value is not specified', function () {
            expect((0, _utils.clauseFiltersByAttribute)({
                type: _constants.FILTER,
                payload: {
                    someAttribute: null
                }
            }, 'someAttribute')).toBe(false);
            expect((0, _utils.clauseFiltersByAttribute)({
                type: _constants.FILTER,
                payload: {}
            }, 'someAttribute')).toBe(false);
        });
    });
});