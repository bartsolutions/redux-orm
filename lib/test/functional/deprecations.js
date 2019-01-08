'use strict';

var _ = require('../../');

var _helpers = require('../helpers');

describe('Deprecations', function () {
    var session = void 0;
    var orm = void 0;
    var state = void 0;
    var consoleWarn = {
        timesRun: 0,
        lastMessage: null
    };

    describe('With session', function () {
        beforeEach(function () {
            var _createTestSessionWit = (0, _helpers.createTestSessionWithData)();

            session = _createTestSessionWit.session;
            orm = _createTestSessionWit.orm;
            state = _createTestSessionWit.state;

            consoleWarn.timesRun = 0;
            consoleWarn.lastMessage = null;
            console.warn = function (msg) {
                consoleWarn.timesRun++;
                consoleWarn.lastMessage = msg;
            };
        });

        it('ORM#withMutations is deprecated', function () {
            expect(consoleWarn.timesRun).toBe(0);

            expect(orm.withMutations(state).state).toEqual(orm.mutableSession(state).state);

            expect(consoleWarn.timesRun).toBe(1);
            expect(consoleWarn.lastMessage).toBe('`ORM.prototype.withMutations` has been deprecated. Use `ORM.prototype.mutableSession` instead.');
        });

        it('ORM#from is deprecated', function () {
            expect(consoleWarn.timesRun).toBe(0);

            expect(orm.from(state).state).toEqual(orm.session(state).state);

            expect(consoleWarn.timesRun).toBe(1);
            expect(consoleWarn.lastMessage).toBe('`ORM.prototype.from` has been deprecated. Use `ORM.prototype.session` instead.');
        });

        it('ORM#reducer is deprecated', function () {
            var _session2 = session,
                Book = _session2.Book;

            Book.reducer = function (action, modelClass, _session) {
                if (action.type !== 'CREATE_BOOK') return;
                modelClass.create(action.payload);
            };
            expect(consoleWarn.timesRun).toBe(0);
            var action = {
                type: 'CREATE_BOOK',
                payload: { name: 'New Book' }
            };

            expect(orm.reducer()(session.state, action)).toEqual((0, _.createReducer)(orm)(session.state, action));

            expect(consoleWarn.timesRun).toBe(1);
            expect(consoleWarn.lastMessage).toBe('`ORM.prototype.reducer` has been deprecated. Access the `Session.prototype.state` property instead.');
        });

        it('ORM#createSelector is deprecated', function () {
            var selector1TimesRun = 0;
            var selector2TimesRun = 0;
            var _session3 = session,
                Book = _session3.Book;

            var selector1 = (0, _.createSelector)(orm, function (memoizeSession) {
                selector1TimesRun++;
                return memoizeSession.Book.withId(0);
            });

            expect(consoleWarn.timesRun).toBe(0);
            var selector2 = orm.createSelector(function (memoizeSession) {
                selector2TimesRun++;
                return memoizeSession.Book.withId(0);
            });
            expect(consoleWarn.timesRun).toBe(1);
            expect(consoleWarn.lastMessage).toBe('`ORM.prototype.createSelector` has been deprecated. Import `createSelector` from Redux-ORM instead.');

            expect(selector1(session.state)).toEqual(selector2(session.state));
            expect(selector1TimesRun).toEqual(selector2TimesRun);

            Book.withId(0).update({ name: 'Deprecated selector test' });

            expect(selector1(session.state)).toEqual(selector2(session.state));
            expect(selector1TimesRun).toEqual(selector2TimesRun);
        });

        it('ORM#getDefaultState is deprecated', function () {
            expect(consoleWarn.timesRun).toBe(0);

            expect(orm.getDefaultState()).toEqual(orm.getEmptyState());

            expect(consoleWarn.timesRun).toBe(1);
            expect(consoleWarn.lastMessage).toBe('`ORM.prototype.getDefaultState` has been deprecated. Use `ORM.prototype.getEmptyState` instead.');
        });

        it('ORM#define is deprecated', function () {
            expect(function () {
                return orm.define();
            }).toThrowError('`ORM.prototype.define` has been removed. Please define a Model class.');
        });

        it('Model.hasId is deprecated', function () {
            expect(consoleWarn.timesRun).toBe(0);
            var _session4 = session,
                Book = _session4.Book;


            expect(Book.hasId(0)).toEqual(Book.idExists(0));
            expect(consoleWarn.timesRun).toBe(1);
            expect(consoleWarn.lastMessage).toBe('`Model.hasId` has been deprecated. Please use `Model.idExists` instead.');

            expect(Book.hasId(4326262342)).toEqual(Book.idExists(4326262342));
            expect(consoleWarn.timesRun).toBe(2);
            expect(consoleWarn.lastMessage).toBe('`Model.hasId` has been deprecated. Please use `Model.idExists` instead.');
        });

        it('Model.backend is deprecated', function () {
            expect(consoleWarn.timesRun).toBe(0);
            var _session5 = session,
                Book = _session5.Book;


            Book.backend = function () {
                return 'retval';
            };
            expect(Book._getTableOpts()).toEqual('retval');
            expect(consoleWarn.timesRun).toBe(1);
            expect(consoleWarn.lastMessage).toBe('`Model.backend` has been deprecated. Please rename to `.options`.');

            Book.backend = 'retval';
            expect(Book._getTableOpts()).toEqual('retval');
            expect(consoleWarn.timesRun).toBe(2);
            expect(consoleWarn.lastMessage).toBe('`Model.backend` has been deprecated. Please rename to `.options`.');
        });

        it('Session#getNextState is deprecated', function () {
            expect(consoleWarn.timesRun).toBe(0);

            expect(session.getNextState()).toEqual(session.state);
            expect(consoleWarn.timesRun).toBe(1);
            expect(consoleWarn.lastMessage).toBe('`Session.prototype.getNextState` has been deprecated. Access the `Session.prototype.state` property instead.');
        });

        it('Session#reduce is deprecated', function () {
            expect(function () {
                return session.reduce();
            }).toThrowError('`Session.prototype.reduce` has been removed. The Redux integration API is now decoupled from ORM and Session - see the 0.9 migration guide in the GitHub repo.');
        });
    });

    describe('Without session', function () {
        var Book = void 0;
        beforeEach(function () {
            orm = (0, _helpers.createTestORM)();
            consoleWarn.timesRun = 0;
            consoleWarn.lastMessage = null;
            console.warn = function (msg) {
                consoleWarn.timesRun++;
                consoleWarn.lastMessage = msg;
            };
            Book = orm.get('Book');
        });

        it('Backend is deprecated', function () {
            expect(function () {
                return new _.Backend();
            }).toThrowError('Having a custom Backend instance is now unsupported. Documentation for database customization is upcoming, for now please look at the db folder in the source.');
        });

        it('Schema is deprecated', function () {
            expect(function () {
                return new _.Schema();
            }).toThrowError('Schema has been renamed to ORM. Please import ORM instead of Schema from Redux-ORM.');
        });

        it('QuerySet#withModels is deprecated', function () {
            var bookQs = orm.get('Book').getQuerySet();
            expect(function () {
                return bookQs.withModels;
            }).toThrowError('`QuerySet.prototype.withModels` has been removed. Use `.toModelArray()` or predicate functions that instantiate Models from refs, e.g. `new Model(ref)`.');
        });

        it('QuerySet#withRefs is deprecated', function () {
            expect(consoleWarn.timesRun).toBe(0);
            var bookQs = Book.getQuerySet();

            expect(bookQs.withRefs).toBe(undefined);

            expect(consoleWarn.timesRun).toBe(1);
            expect(consoleWarn.lastMessage).toBe('`QuerySet.prototype.withRefs` has been deprecated. ' + 'Query building operates on refs only now.');
        });

        it('QuerySet#map is deprecated', function () {
            var bookQs = Book.getQuerySet();
            expect(function () {
                return bookQs.map();
            }).toThrowError('`QuerySet.prototype.map` has been removed. Call `.toModelArray()` or `.toRefArray()` first to map.');
        });

        it('QuerySet#forEach is deprecated', function () {
            var bookQs = Book.getQuerySet();
            expect(function () {
                return bookQs.forEach();
            }).toThrowError('`QuerySet.prototype.forEach` has been removed. Call `.toModelArray()` or `.toRefArray()` first to iterate.');
        });

        it('Model#getNextState is deprecated', function () {
            var book = new Book();
            expect(function () {
                return book.getNextState();
            }).toThrowError('`Model.prototype.getNextState` has been removed. See the 0.9 migration guide on the GitHub repo.');
        });
    });
});