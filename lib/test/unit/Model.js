'use strict';

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _ = require('../../');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('Model', function () {
    describe('static method', function () {
        var Model = void 0;
        var sessionMock = void 0;
        beforeEach(function () {
            // Get a fresh copy
            // of Model, so our manipulations
            // won't survive longer than each test.
            Model = function (_BaseModel) {
                (0, _inherits3.default)(UnitTestModel, _BaseModel);

                function UnitTestModel() {
                    (0, _classCallCheck3.default)(this, UnitTestModel);
                    return (0, _possibleConstructorReturn3.default)(this, (UnitTestModel.__proto__ || (0, _getPrototypeOf2.default)(UnitTestModel)).apply(this, arguments));
                }

                return UnitTestModel;
            }(_.Model);
            Model.modelName = 'UnitTestModel';

            var orm = new _.ORM();
            orm.register(Model);
            sessionMock = orm.session();
        });

        it('make sure instance methods are enumerable', function () {
            // See #29.

            var enumerableProps = {};
            for (var propName in Model) {
                // eslint-disable-line
                enumerableProps[propName] = true;
            }

            expect(enumerableProps.create).toBe(true);
        });

        it('session getter works correctly', function () {
            expect(Model.session).toBeUndefined();
            Model._session = sessionMock;
            expect(Model.session).toBe(sessionMock);
        });

        it('connect defines session statically on Model', function () {
            expect(Model.session).toBeUndefined();
            Model.connect(sessionMock);
            expect(Model.session).toBe(sessionMock);
        });

        it('connect throws if not passing a session', function () {
            expect(Model.session).toBeUndefined();
            [1, '', [], {}].forEach(function (value) {
                return expect(function () {
                    Model.connect(value);
                }).toThrowError('A model can only be connected to instances of Session.');
            });
        });

        it('toString works correctly', function () {
            expect(Model.toString()).toBe('ModelClass: UnitTestModel');
        });

        it('query returns QuerySet', function () {
            expect(Model.query).toBeInstanceOf(_.QuerySet);
        });

        it('getQuerySet returns QuerySet', function () {
            expect(Model.getQuerySet()).toBeInstanceOf(_.QuerySet);
        });

        it('all returns QuerySet', function () {
            expect(Model.all()).toBeInstanceOf(_.QuerySet);
        });

        it('markAccessed correctly proxies to Session', function () {
            Model.connect(sessionMock);
            Model.markAccessed([1, 3]);
            expect(sessionMock.accessedModelInstances).toEqual({
                UnitTestModel: {
                    1: true,
                    3: true
                }
            });
        });

        it('markFullTableScanned correctly proxies to Session', function () {
            Model.connect(sessionMock);
            Model.markFullTableScanned();
            expect(sessionMock.fullTableScannedModels).toEqual(['UnitTestModel']);
        });

        it('should throw a custom error when user try to interact with database without a session', function () {
            var attributes = {
                id: 0,
                name: 'Tommi',
                number: 123,
                boolean: false
            };
            expect(function () {
                return Model.create(attributes);
            }).toThrowError('Tried to create a UnitTestModel model instance without a session. Create a session using `session = orm.session()` and call `session["UnitTestModel"].create` instead.');
            expect(function () {
                return Model.upsert(attributes);
            }).toThrowError('Tried to upsert a UnitTestModel model instance without a session. Create a session using `session = orm.session()` and call `session["UnitTestModel"].upsert` instead.');
            expect(function () {
                return Model.exists(attributes);
            }).toThrowError('Tried to check if a UnitTestModel model instance exists without a session. Create a session using `session = orm.session()` and call `session["UnitTestModel"].exists` instead.');
            expect(function () {
                return Model.withId(0);
            }).toThrowError('Tried to get the UnitTestModel model\'s id attribute without a session. Create a session using `session = orm.session()` and access `session["UnitTestModel"].idAttribute` instead.');
            expect(function () {
                return new Model().update(attributes);
            }).toThrowError('Tried to update a UnitTestModel model instance without a session. You cannot call `.update` on an instance that you did not receive from the database.');
            expect(function () {
                return new Model().delete();
            }).toThrowError('Tried to delete a UnitTestModel model instance without a session. You cannot call `.delete` on an instance that you did not receive from the database.');
        });
    });

    describe('Instance methods', function () {
        var Model = void 0;
        var session = void 0;

        beforeEach(function () {
            Model = function (_BaseModel2) {
                (0, _inherits3.default)(UnitTestModel, _BaseModel2);

                function UnitTestModel() {
                    (0, _classCallCheck3.default)(this, UnitTestModel);
                    return (0, _possibleConstructorReturn3.default)(this, (UnitTestModel.__proto__ || (0, _getPrototypeOf2.default)(UnitTestModel)).apply(this, arguments));
                }

                return UnitTestModel;
            }(_.Model);
            Model.modelName = 'UnitTestModel';
            Model.fields = {
                id: (0, _.attr)(),
                name: (0, _.attr)(),
                number: (0, _.attr)(),
                boolean: (0, _.attr)(),
                array: (0, _.attr)(),
                object: (0, _.attr)()
            };

            var orm = new _.ORM();
            orm.register(Model);
            session = orm.session();
        });

        it('getClass works correctly', function () {
            var instance = new Model({
                id: 0,
                name: 'Tommi',
                array: [],
                object: {},
                number: 123,
                boolean: false
            });
            expect(instance.getClass()).toBe(Model);
        });

        it('equals compares primitive types correctly', function () {
            var instance1 = new Model({
                id: 0,
                name: 'Tommi',
                number: 123,
                boolean: true
            });
            var instance2 = new Model({
                id: 0,
                name: 'Tommi',
                number: 123,
                boolean: true
            });
            expect(instance1.equals(instance2)).toBeTruthy();
            var instance3 = new Model({
                id: 0,
                name: 'Tommi',
                number: 123,
                boolean: false
            });
            expect(instance1.equals(instance3)).toBeFalsy();
        });

        it('equals does not deeply compare array fields', function () {
            var instance1 = new Model({ id: 0, array: [] });
            var instance2 = new Model({ id: 0, array: [] });
            expect(instance1.equals(instance2)).toBeFalsy();
        });

        it('equals does not deeply compare object fields', function () {
            var instance1 = new Model({ id: 0, object: {} });
            var instance2 = new Model({ id: 0, object: {} });
            expect(instance1.equals(instance2)).toBeFalsy();
        });

        it('constructing with random attributes assigns these attributes', function () {
            var randomNumber = Math.random();
            var model = new Model({
                randomNumber: randomNumber,
                someString: 'some string'
            });
            expect(model.randomNumber).toBe(randomNumber);
            expect(model.someString).toBe('some string');
        });
    });
});