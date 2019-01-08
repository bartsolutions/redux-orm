'use strict';

var _ = require('../../');

var _helpers = require('../helpers');

var _constants = require('../../constants');

describe('Session', function () {
    var orm = void 0;
    var Book = void 0;
    var Cover = void 0;
    var Genre = void 0;
    var Tag = void 0;
    var Author = void 0;
    var Publisher = void 0;
    var emptyState = void 0;
    beforeEach(function () {
        var _createTestModels = (0, _helpers.createTestModels)();

        Book = _createTestModels.Book;
        Cover = _createTestModels.Cover;
        Genre = _createTestModels.Genre;
        Tag = _createTestModels.Tag;
        Author = _createTestModels.Author;
        Publisher = _createTestModels.Publisher;

        orm = new _.ORM();
        orm.register(Book, Cover, Genre, Tag, Author, Publisher);
        emptyState = orm.getEmptyState();
    });

    it('connects models', function () {
        expect(Book.session).toBeUndefined();
        expect(Cover.session).toBeUndefined();
        expect(Genre.session).toBeUndefined();
        expect(Tag.session).toBeUndefined();
        expect(Cover.session).toBeUndefined();
        expect(Publisher.session).toBeUndefined();

        var session = orm.session();

        expect(session.Book.session).toBe(session);
        expect(session.Cover.session).toBe(session);
        expect(session.Genre.session).toBe(session);
        expect(session.Tag.session).toBe(session);
        expect(session.Cover.session).toBe(session);
        expect(session.Publisher.session).toBe(session);
    });

    it('exposes models as getter properties', function () {
        var session = orm.session();
        expect((0, _helpers.isSubclass)(session.Book, Book)).toBe(true);
        expect((0, _helpers.isSubclass)(session.Author, Author)).toBe(true);
        expect((0, _helpers.isSubclass)(session.Cover, Cover)).toBe(true);
        expect((0, _helpers.isSubclass)(session.Genre, Genre)).toBe(true);
        expect((0, _helpers.isSubclass)(session.Tag, Tag)).toBe(true);
        expect((0, _helpers.isSubclass)(session.Publisher, Publisher)).toBe(true);
    });

    it('marks models when full table scan has been performed', function () {
        var session = orm.session();
        expect(session.fullTableScannedModels).toHaveLength(0);

        session.markFullTableScanned(Book.modelName);
        expect(session.fullTableScannedModels).toHaveLength(1);
        expect(session.fullTableScannedModels[0]).toBe('Book');

        session.markFullTableScanned(Book.modelName);

        expect(session.fullTableScannedModels[0]).toBe('Book');
    });

    it('marks accessed model instances', function () {
        var session = orm.session();
        expect(session.accessedModelInstances).toEqual({});

        session.markAccessed(Book.modelName, [0]);

        expect(session.accessedModelInstances).toEqual({
            Book: {
                0: true
            }
        });

        session.markAccessed(Book.modelName, [1]);
        expect(session.accessedModelInstances).toEqual({
            Book: {
                0: true,
                1: true
            }
        });
    });

    it('throws when failing to apply updates', function () {
        var session = orm.session();
        session.db = {
            update: function update() {
                return {
                    payload: 123,
                    status: 'failed',
                    state: {}
                };
            }
        };
        expect(function () {
            return session.applyUpdate({});
        }).toThrowError('Applying update failed with status failed. Payload: 123');
    });

    describe('gets the next state', function () {
        it('without any updates, the same state is returned', function () {
            var session = orm.session();
            expect(session.state).toEqual(emptyState);
        });

        it('with updates, a new state is returned', function () {
            var session = orm.session(emptyState);

            session.applyUpdate({
                table: Author.modelName,
                action: _constants.CREATE,
                payload: {
                    id: 0,
                    name: 'Caesar'
                }
            });

            var nextState = session.state;

            expect(nextState).not.toBe(emptyState);

            expect(nextState[Author.modelName]).not.toBe(emptyState[Author.modelName]);

            // All other model states should stay equal.
            expect(nextState[Book.modelName]).toBe(emptyState[Book.modelName]);
            expect(nextState[Cover.modelName]).toBe(emptyState[Cover.modelName]);
            expect(nextState[Genre.modelName]).toBe(emptyState[Genre.modelName]);
            expect(nextState[Tag.modelName]).toBe(emptyState[Tag.modelName]);
            expect(nextState[Publisher.modelName]).toBe(emptyState[Publisher.modelName]);
        });
    });
});