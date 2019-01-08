'use strict';

var _helpers = require('../helpers');

describe('Mutating session', function () {
    var session = void 0;
    var orm = void 0;
    var state = void 0;

    beforeEach(function () {
        var _createTestSessionWit = (0, _helpers.createTestSessionWithData)();

        session = _createTestSessionWit.session;
        orm = _createTestSessionWit.orm;
        state = _createTestSessionWit.state;
    });

    it('works', function () {
        var mutating = orm.mutableSession(state);
        var Book = mutating.Book,
            Cover = mutating.Cover;


        var cover = Cover.create({ src: 'somecover.png' });
        var coverId = cover.getId();

        var book = Book.first();
        var bookRef = book.ref;
        var bookId = book.getId();
        expect(state.Book.itemsById[bookId]).toBe(bookRef);
        var newName = 'New Name';

        book.name = newName;

        expect(book.name).toBe(newName);

        var nextState = mutating.state;
        expect(nextState).toBe(state);
        expect(state.Book.itemsById[bookId]).toBe(bookRef);
        expect(bookRef.name).toBe(newName);
        expect(state.Cover.itemsById[coverId].src).toBe('somecover.png');
    });
});