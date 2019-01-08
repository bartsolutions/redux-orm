'use strict';

var _helpers = require('../helpers');

describe('Multiple concurrent sessions', function () {
    var session = void 0;
    var orm = void 0;
    var state = void 0;

    beforeEach(function () {
        var _createTestSessionWit = (0, _helpers.createTestSessionWithData)();

        session = _createTestSessionWit.session;
        orm = _createTestSessionWit.orm;
        state = _createTestSessionWit.state;
    });

    it('separate sessions can manage separate data stores', function () {
        var firstSession = session;
        var secondSession = orm.session(state);

        expect(firstSession.Book.count()).toBe(3);
        expect(secondSession.Book.count()).toBe(3);

        var newBookProps = {
            name: 'New Book',
            author: 0,
            releaseYear: 2015,
            genres: [0, 1]
        };

        firstSession.Book.create(newBookProps);

        expect(firstSession.Book.count()).toBe(4);
        expect(secondSession.Book.count()).toBe(3);
    });

    it('separate sessions have different session bound models', function () {
        var firstSession = orm.session();
        var secondSession = orm.session();

        expect(firstSession.Book).not.toBe(secondSession.Book);
        expect(firstSession.Author).not.toBe(secondSession.Author);
        expect(firstSession.Genre).not.toBe(secondSession.Genre);
        expect(firstSession.Tag).not.toBe(secondSession.Tag);
        expect(firstSession.Cover).not.toBe(secondSession.Cover);
        expect(firstSession.Publisher).not.toBe(secondSession.Publisher);
    });
});