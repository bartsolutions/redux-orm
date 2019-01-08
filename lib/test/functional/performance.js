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

var _helpers = require('../helpers');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('Big Data Test', function () {
    var orm = void 0;
    var session = void 0;

    beforeEach(function () {
        var Item = function (_Model) {
            (0, _inherits3.default)(Item, _Model);

            function Item() {
                (0, _classCallCheck3.default)(this, Item);
                return (0, _possibleConstructorReturn3.default)(this, (Item.__proto__ || (0, _getPrototypeOf2.default)(Item)).apply(this, arguments));
            }

            return Item;
        }(_.Model);
        Item.modelName = 'Item';
        Item.fields = {
            id: (0, _.attr)(),
            name: (0, _.attr)()
        };
        orm = new _.ORM();
        orm.register(Item);
        session = orm.session(orm.getEmptyState());
    });

    it('adds a big amount of items in acceptable time', function () {
        var _session = session,
            Item = _session.Item;

        var start = (0, _helpers.measureMs)();

        var amount = 10000;
        for (var i = 0; i < amount; ++i) {
            Item.create({ id: i, name: 'TestItem' });
        }
        var tookSeconds = (0, _helpers.measureMs)(start) / 1000;
        console.log('Creating ' + amount + ' objects took ' + tookSeconds + 's');
        expect(tookSeconds).toBeLessThanOrEqual(process.env.TRAVIS ? 2.5 : 0.85);
    });

    it('looks up items by id in a large table in acceptable time', function () {
        var _session2 = session,
            Item = _session2.Item;


        var rowCount = 20000;
        for (var i = 0; i < rowCount; ++i) {
            Item.create({ id: i, name: 'TestItem' });
        }

        var lookupCount = 10000;
        var maxId = rowCount - 1;
        var start = (0, _helpers.measureMs)();
        for (var j = maxId, n = maxId - lookupCount; j > n; --j) {
            Item.withId(j);
        }
        var tookSeconds = (0, _helpers.measureMs)(start) / 1000;
        console.log('Looking up ' + lookupCount + ' objects by id took ' + tookSeconds + 's');
        expect(tookSeconds).toBeLessThanOrEqual(process.env.TRAVIS ? 1 : 0.75);
    });
});

describe('Many-to-many relationship performance', function () {
    var orm = void 0;
    var session = void 0;

    beforeEach(function () {
        var Parent = function (_Model2) {
            (0, _inherits3.default)(Parent, _Model2);

            function Parent() {
                (0, _classCallCheck3.default)(this, Parent);
                return (0, _possibleConstructorReturn3.default)(this, (Parent.__proto__ || (0, _getPrototypeOf2.default)(Parent)).apply(this, arguments));
            }

            return Parent;
        }(_.Model);
        Parent.modelName = 'Parent';
        Parent.fields = {
            id: (0, _.attr)(),
            name: (0, _.attr)(),
            children: (0, _.many)('Child', 'parent')
        };
        var Child = function (_Model3) {
            (0, _inherits3.default)(Child, _Model3);

            function Child() {
                (0, _classCallCheck3.default)(this, Child);
                return (0, _possibleConstructorReturn3.default)(this, (Child.__proto__ || (0, _getPrototypeOf2.default)(Child)).apply(this, arguments));
            }

            return Child;
        }(_.Model);
        Child.modelName = 'Child';
        orm = new _.ORM();
        orm.register(Parent, Child);
        session = orm.session(orm.getEmptyState());
    });

    var createChildren = function createChildren(amount) {
        for (var i = 0; i < amount; ++i) {
            session.Child.create({
                id: i,
                name: 'TestChild'
            });
        }
    };

    var assignChildren = function assignChildren(parent, amount) {
        for (var i = 0; i < amount; ++i) {
            parent.children.add(i);
        }
    };

    it('adds many-to-many relationships in acceptable time', function () {
        var _session3 = session,
            Child = _session3.Child,
            Parent = _session3.Parent;


        createChildren(8000);
        var parent = Parent.create({});
        var start = (0, _helpers.measureMs)();
        var childAmount = 2500;
        assignChildren(parent, childAmount);

        var tookSeconds = (0, _helpers.measureMs)(start) / 1000;
        console.log('Adding ' + childAmount + ' relations took ' + tookSeconds + 's');
        expect(tookSeconds).toBeLessThanOrEqual(process.env.TRAVIS ? 13.5 : 4);
    });

    it('queries many-to-many relationships in acceptable time', function () {
        var _session4 = session,
            Child = _session4.Child,
            Parent = _session4.Parent;


        createChildren(10000);
        var parent = Parent.create({});
        assignChildren(parent, 3000);

        var start = (0, _helpers.measureMs)();
        var queryCount = 500;
        for (var j = 0; j < queryCount; ++j) {
            parent.children.count();
        }

        var tookSeconds = (0, _helpers.measureMs)(start) / 1000;
        console.log('Performing ' + queryCount + ' queries took ' + tookSeconds + 's');
        expect(tookSeconds).toBeLessThanOrEqual(process.env.TRAVIS ? 15 : 4);
    });

    it('removes many-to-many relationships in acceptable time', function () {
        var _session5 = session,
            Child = _session5.Child,
            Parent = _session5.Parent;


        createChildren(10000);
        var parent = Parent.create({});
        assignChildren(parent, 2000);

        var removeCount = 1000;
        var start = (0, _helpers.measureMs)();
        for (var j = 0; j < removeCount; ++j) {
            parent.children.remove(j);
        }

        var tookSeconds = (0, _helpers.measureMs)(start) / 1000;
        console.log('Removing ' + removeCount + ' relations took ' + tookSeconds + 's');
        expect(tookSeconds).toBeLessThanOrEqual(process.env.TRAVIS ? 15 : 4);
    });
});