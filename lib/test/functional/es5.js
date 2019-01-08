'use strict';

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _require = require('../../../lib'),
    Model = _require.Model,
    ORM = _require.ORM; // eslint-disable-line import/no-unresolved

describe('ES5 library code', function () {
    describe('With ES6 client code', function () {
        var orm = void 0;
        var session = void 0;
        beforeEach(function () {
            var Book = function (_Model) {
                (0, _inherits3.default)(Book, _Model);

                function Book() {
                    (0, _classCallCheck3.default)(this, Book);
                    return (0, _possibleConstructorReturn3.default)(this, (Book.__proto__ || (0, _getPrototypeOf2.default)(Book)).apply(this, arguments));
                }

                return Book;
            }(Model);

            Book.modelName = 'Book';
            orm = new ORM();
            orm.register(Book);
            session = orm.session();
        });
        it('Model CRUD works', function () {
            var book = void 0;
            expect(function () {
                book = session.Book.create({ id: 1, title: 'title' });
            }).not.toThrowError();
            expect(function () {
                book.update({ id: 1, title: 'new title' });
            }).not.toThrowError();
        });
    });
});