'use strict';

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _deepFreeze = require('deep-freeze');

var _deepFreeze2 = _interopRequireDefault(_deepFreeze);

var _ = require('../../');

var _helpers = require('../helpers');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('Immutable session', function () {
    var session = void 0;
    var orm = void 0;
    var state = void 0;

    beforeEach(function () {
        var _createTestSessionWit = (0, _helpers.createTestSessionWithData)();
        // Deep freeze state. This will raise an error if we
        // mutate the state.

        session = _createTestSessionWit.session;
        orm = _createTestSessionWit.orm;
        state = _createTestSessionWit.state;


        (0, _deepFreeze2.default)(state);
    });

    it('Initial data bootstrapping results in a correct state', function () {
        expect(state).toEqual(expect.objectContaining({
            Book: expect.anything(),
            Cover: expect.anything(),
            Genre: expect.anything(),
            Tag: expect.anything(),
            Author: expect.anything(),
            BookGenres: expect.anything(),
            BookTags: expect.anything(),
            Movie: expect.anything()
        }));

        expect(state.Book.items).toHaveLength(3);
        expect((0, _keys2.default)(state.Book.itemsById)).toHaveLength(3);

        expect(state.Cover.items).toHaveLength(3);
        expect((0, _keys2.default)(state.Cover.itemsById)).toHaveLength(3);

        expect(state.Genre.items).toHaveLength(4);
        expect((0, _keys2.default)(state.Genre.itemsById)).toHaveLength(4);

        expect(state.BookGenres.items).toHaveLength(5);
        expect((0, _keys2.default)(state.BookGenres.itemsById)).toHaveLength(5);

        expect(state.Tag.items).toHaveLength(4);
        expect((0, _keys2.default)(state.Tag.itemsById)).toHaveLength(4);

        expect(state.BookTags.items).toHaveLength(5);
        expect((0, _keys2.default)(state.BookTags.itemsById)).toHaveLength(5);

        expect(state.Author.items).toHaveLength(3);
        expect((0, _keys2.default)(state.Author.itemsById)).toHaveLength(3);

        expect(state.Publisher.items).toHaveLength(3);
        expect((0, _keys2.default)(state.Publisher.itemsById)).toHaveLength(3);

        expect(state.Movie.items).toHaveLength(1);
        expect((0, _keys2.default)(state.Movie.itemsById)).toHaveLength(1);
    });

    it('Models correctly indicate if id exists', function () {
        var _session = session,
            Book = _session.Book;

        expect(Book.idExists(0)).toBe(true);
        expect(Book.idExists(92384)).toBe(false);
        expect(Book.idExists()).toBe(false);
    });

    it('Models correctly create new instances', function () {
        var _session2 = session,
            Book = _session2.Book;

        var book = Book.create({
            name: 'New Book',
            author: 0,
            releaseYear: 2015,
            publisher: 0
        });
        expect(session.Book.count()).toBe(4);
        expect(session.Book.last().ref).toBe(book.ref);
    });

    it('Model.getId works', function () {
        var _session3 = session,
            Book = _session3.Book;

        expect(Book.withId(0).getId()).toBe(0);
        expect(Book.withId(1).getId()).toBe(1);
    });

    it('Model.create throws if passing duplicate ids to many-to-many field', function () {
        var _session4 = session,
            Book = _session4.Book;


        var newProps = {
            name: 'New Book',
            author: 0,
            releaseYear: 2015,
            genres: [0, 0],
            publisher: 0
        };

        expect(function () {
            return Book.create(newProps);
        }).toThrowError('Book.genres');
    });

    it('Models are correctly deleted', function () {
        var _session5 = session,
            Book = _session5.Book;

        expect(Book.count()).toBe(3);
        Book.withId(0).delete();
        expect(session.Book.count()).toBe(2);
        expect(session.Book.idExists(0)).toBe(false);
    });

    it('Models with backwards virtual (1-to-n) key fields are correctly deleted', function () {
        var _session6 = session,
            Author = _session6.Author;

        expect(Author.count()).toBe(3);
        Author.withId(0).delete();
        expect(session.Author.count()).toBe(2);
        expect(session.Author.idExists(0)).toBe(false);
    });

    it('Models with backwards virtual 1-to-1 key fields are correctly deleted', function () {
        var _session7 = session,
            Cover = _session7.Cover;

        expect(Cover.count()).toBe(3);
        Cover.withId(0).delete();
        expect(session.Cover.count()).toBe(2);
        expect(session.Cover.idExists(0)).toBe(false);
    });

    it('Models correctly update when setting properties', function () {
        var _session8 = session,
            Book = _session8.Book;

        var book = Book.first();
        var newName = 'New Name';
        book.name = newName;
        expect(session.Book.first().name).toBe(newName);
    });

    it('Model.toString works', function () {
        var _session9 = session,
            Book = _session9.Book;

        var book = Book.first();
        expect(book.toString()).toBe('Book: {id: 0, name: Tommi Kaikkonen - an Autobiography, ' + 'releaseYear: 2050, author: 0, cover: 0, genres: [0, 1], tags: [Technology, Literary], publisher: 1}');
    });

    it('withId returns null if model instance not found', function () {
        var _session10 = session,
            Book = _session10.Book;

        expect(Book.withId(9043290)).toBe(null);
    });

    it('get returns null if model instance not found', function () {
        var _session11 = session,
            Book = _session11.Book;

        expect(Book.get({
            name: 'does not exist'
        })).toBe(null);
    });

    it('get throws if multiple model instances are found', function () {
        var _session12 = session,
            Book = _session12.Book;

        var book = Book.create({
            name: 'Clean Code'
        });
        expect(function () {
            return Book.get({
                name: 'Clean Code'
            });
        }).toThrowError('Expected to find a single row in `Book.get`. Found 2.');
    });

    it('updating arbitrary fields created during model construction works', function () {
        var _session13 = session,
            Book = _session13.Book;

        var book = new Book({ someNumber: 123 });
        expect(book.someNumber).toBe(123);
        book.someNumber = 321;
        expect(book.someNumber).toBe(321);
    });

    it('Models correctly create a new instance via upsert when not passing an ID', function () {
        var _session14 = session,
            Book = _session14.Book;

        var book = Book.upsert({
            name: 'New Book',
            author: 0,
            releaseYear: 2015,
            publisher: 0
        });
        expect(session.Book.count()).toBe(4);
        expect(session.Book.last().ref).toBe(book.ref);
        expect(book).toBeInstanceOf(Book);
    });

    it('Models correctly create a new instance via upsert when passing a non-existant ID', function () {
        var _Book$upsert;

        var _session15 = session,
            Book = _session15.Book;

        var book = Book.upsert((_Book$upsert = {}, (0, _defineProperty3.default)(_Book$upsert, Book.idAttribute, 123123132), (0, _defineProperty3.default)(_Book$upsert, 'name', 'New Book'), (0, _defineProperty3.default)(_Book$upsert, 'author', 0), (0, _defineProperty3.default)(_Book$upsert, 'releaseYear', 2015), (0, _defineProperty3.default)(_Book$upsert, 'publisher', 0), _Book$upsert));
        expect(session.Book.count()).toBe(4);
        expect(session.Book.last().ref).toBe(book.ref);
        expect(book).toBeInstanceOf(Book);
    });

    it('Models correctly update existing instance via upsert', function () {
        var _Book$upsert2;

        var _session16 = session,
            Book = _session16.Book;

        var book = Book.create({
            name: 'New Book',
            author: 0,
            releaseYear: 2015,
            publisher: 0
        });
        expect(session.Book.count()).toBe(4);
        expect(session.Book.last().ref).toBe(book.ref);
        expect(session.Book.last().releaseYear).toBe(2015);

        var storedRef = book.ref;

        var nextBook = Book.upsert((_Book$upsert2 = {}, (0, _defineProperty3.default)(_Book$upsert2, Book.idAttribute, book.getId()), (0, _defineProperty3.default)(_Book$upsert2, 'releaseYear', 2016), _Book$upsert2));

        expect(session.Book.count()).toBe(4);
        expect(session.Book.last().ref).toBe(nextBook.ref);
        expect(session.Book.last().releaseYear).toBe(2016);
        expect(session.Book.last().ref).not.toBe(storedRef);
        expect(book.ref).toBe(nextBook.ref);
        expect(nextBook).toBeInstanceOf(Book);
    });

    it('Model updates preserve instance reference if fields are referentially equal', function () {
        var _session17 = session,
            Movie = _session17.Movie;


        var movie = Movie.first();
        var name = movie.name,
            characters = movie.characters,
            meta = movie.meta;

        var oldRef = movie.ref;

        movie.update({ name: name });
        expect(oldRef).toBe(movie.ref);

        movie.update({ meta: meta });
        expect(oldRef).toBe(movie.ref);

        movie.update({ characters: characters });
        expect(oldRef).toBe(movie.ref);
    });

    it('Model updates change instance reference if string field changes', function () {
        var _session18 = session,
            Movie = _session18.Movie;


        var movie = Movie.first();
        var oldRef = movie.ref;

        movie.update({ name: 'New name' });
        expect(oldRef).not.toBe(movie.ref);
    });

    it('Model updates change instance reference if object field changes reference', function () {
        var _session19 = session,
            Movie = _session19.Movie;


        var movie = Movie.first();
        var oldRef = movie.ref;

        movie.update({ meta: {} });
        expect(oldRef).not.toBe(movie.ref);
    });

    it('Model updates only change instance reference if equals returns false', function () {
        var _session20 = session,
            Movie = _session20.Movie;


        var movie = Movie.first();
        var oldRef = movie.ref;

        movie.equals = function (otherModel) {
            return true;
        };
        movie.update({
            name: 'New name',
            rating: 10,
            hasPremiered: false,
            characters: [],
            meta: {}
        });
        expect(oldRef).toBe(movie.ref);

        var movie2 = Movie.create({
            characters: ['Joker']
        });
        var oldRef2 = movie2.ref;
        movie2.equals = function characterAmountsEqual(otherModel) {
            return this._fields.characters.length === otherModel._fields.characters.length;
        };

        // length of characters array is equal, should not cause change of reference
        movie2.update({ characters: ['Joker'] });
        expect(oldRef2).toBe(movie2.ref);

        // length of characters array has changed, should cause change of reference
        movie2.update({ characters: ['Joker', 'Mickey Mouse'] });
        expect(oldRef2).not.toBe(movie2.ref);
        var newRef2 = movie2.ref;

        // length of characters array has not changed, should cause change of reference
        movie2.update({ characters: ['Batman', 'Catwoman'] });
        expect(newRef2).toBe(movie2.ref);
    });

    it('Model updates preserve relations if only other fields are changed', function () {
        var _session21 = session,
            Book = _session21.Book;


        var genres = [1, 2];
        var book = Book.create({
            name: 'Book name',
            genres: genres
        });
        expect(book.genres.all().toRefArray().map(function (genre) {
            return genre.id;
        })).toEqual([1, 2]);
        // update with same string, expect relations to be preserved
        book.update({ name: 'Updated Book name' });
        expect(book.genres.all().toRefArray().map(function (genre) {
            return genre.id;
        })).toEqual([1, 2]);
    });

    it('Model updates change relations if only relations are updated', function () {
        var _session22 = session,
            Book = _session22.Book,
            Genre = _session22.Genre;


        var genres = [1, 2];
        var book = Book.create({
            name: 'New Book',
            genres: genres
        });
        expect(book.genres.all().toRefArray().map(function (genre) {
            return genre.id;
        })).toEqual([1, 2]);

        // mutate array by appending element without changing reference
        genres.push(3);
        // update book with field containing the same reference
        book.update({ genres: genres });
        /**
            * update should have seen equality of fields
            * but still caused an update of the genres relation
            */
        expect(book.genres.all().toRefArray().map(function (genre) {
            return genre.id;
        })).toEqual([1, 2, 3]);
        /* the backward relation must have been updated as well */
        expect(Genre.withId(3).books.all().toRefArray().map(function (_book) {
            return _book.id;
        }).includes(book.id)).toBeTruthy();
    });

    it('many-to-many relationship descriptors work', function () {
        var _session23 = session,
            Book = _session23.Book,
            Genre = _session23.Genre,
            Tag = _session23.Tag;

        // Forward (from many-to-many field declaration)

        var book = Book.first();
        var relatedGenres = book.genres;
        expect(relatedGenres).toBeInstanceOf(_.QuerySet);
        expect(relatedGenres.modelClass).toBe(Genre);
        expect(relatedGenres.count()).toBe(2);

        // Backward
        var genre = Genre.first();
        var relatedBooks = genre.books;
        expect(relatedBooks).toBeInstanceOf(_.QuerySet);
        expect(relatedBooks.modelClass).toBe(Book);

        // Forward (from many-to-many field declaration with idAttribute is name)
        var relatedTags = book.tags;
        expect(relatedTags).toBeInstanceOf(_.QuerySet);
        expect(relatedTags.modelClass).toBe(Tag);
        expect(relatedTags.count()).toBe(2);

        // Backward
        var tag = Tag.first();
        var tagRelatedBooks = tag.books;
        expect(tagRelatedBooks).toBeInstanceOf(_.QuerySet);
        expect(tagRelatedBooks.modelClass).toBe(Book);
    });

    it('many-to-many relationship descriptors work with a custom through model', function () {
        var _session24 = session,
            Author = _session24.Author,
            Publisher = _session24.Publisher;

        // Forward (from many-to-many field declaration)

        var author = Author.get({ name: 'Tommi Kaikkonen' });
        var relatedPublishers = author.publishers;
        expect(relatedPublishers).toBeInstanceOf(_.QuerySet);
        expect(relatedPublishers.modelClass).toBe(Publisher);
        expect(relatedPublishers.count()).toBe(1);

        // Backward
        var publisher = Publisher.get({ name: 'Technical Publishing' });
        var relatedAuthors = publisher.authors;
        expect(relatedAuthors).toBeInstanceOf(_.QuerySet);
        expect(relatedAuthors.modelClass).toBe(Author);
        expect(relatedAuthors.count()).toBe(2);
    });

    it('adding related many-to-many entities works', function () {
        var _session25 = session,
            Book = _session25.Book,
            Genre = _session25.Genre;

        var book = Book.withId(0);
        expect(book.genres.count()).toBe(2);
        book.genres.add(Genre.withId(2));
        expect(book.genres.count()).toBe(3);
    });

    it('trying to add existing related many-to-many entities throws', function () {
        var _session26 = session,
            Book = _session26.Book;

        var book = Book.withId(0);

        var existingId = 1;
        expect(function () {
            return book.genres.add(existingId);
        }).toThrowError(existingId.toString());
    });

    it('trying to set many-to-many fields throws', function () {
        var _session27 = session,
            Book = _session27.Book;

        var book = Book.withId(0);

        expect(function () {
            book.genres = 'whatever';
        }).toThrowError('Tried setting a M2M field. Please use the related QuerySet methods add, remove and clear.');
    });

    it('updating related many-to-many entities through ids works', function () {
        var _session28 = session,
            Genre = _session28.Genre,
            Author = _session28.Author;

        var tommi = Author.get({ name: 'Tommi Kaikkonen' });
        var book = tommi.books.first();
        expect(book.genres.toRefArray().map(function (row) {
            return row.id;
        })).toEqual([0, 1]);

        var deleteGenre = Genre.withId(0);

        book.update({ genres: [1, 2] });
        expect(book.genres.toRefArray().map(function (row) {
            return row.id;
        })).toEqual([1, 2]);

        expect(deleteGenre.books.filter({ id: book.id }).exists()).toBe(false);
    });

    it('updating related many-to-many with not existing entities works', function () {
        var _session29 = session,
            Book = _session29.Book;

        var book = Book.first();

        book.update({ genres: [0, 99] });

        expect(session.BookGenres.filter({ fromBookId: book.id }).toRefArray().map(function (row) {
            return row.toGenreId;
        })).toEqual([0, 99]);
        expect(book.genres.toRefArray().map(function (row) {
            return row.id;
        })).toEqual([0]);

        book.update({ genres: [1, 98] });

        expect(session.BookGenres.filter({ fromBookId: book.id }).toRefArray().map(function (row) {
            return row.toGenreId;
        })).toEqual([1, 98]);
        expect(book.genres.toRefArray().map(function (row) {
            return row.id;
        })).toEqual([1]);
    });

    it('updating non-existing many-to-many entities works', function () {
        var _session30 = session,
            Genre = _session30.Genre,
            Author = _session30.Author;

        var tommi = Author.get({ name: 'Tommi Kaikkonen' });
        var book = tommi.books.first();
        expect(book.genres.toRefArray().map(function (row) {
            return row.id;
        })).toEqual([0, 1]);

        var deleteGenre = Genre.withId(0);
        var keepGenre = Genre.withId(1);
        var addGenre = Genre.withId(2);

        book.update({ genres: [addGenre, keepGenre] });
        expect(book.genres.toRefArray().map(function (row) {
            return row.id;
        })).toEqual([1, 2]);

        expect(deleteGenre.books.filter({ id: book.id }).exists()).toBe(false);
    });

    it('creating models without many-to-many entities works', function () {
        var _session31 = session,
            Book = _session31.Book;

        expect(function () {
            Book.create({ id: 457656121 });
        }).not.toThrowError();
    });

    it('creating models throws when passing non-array many field', function () {
        var _session32 = session,
            Book = _session32.Book;

        [null, undefined, 353, 'a string'].forEach(function (value) {
            expect(function () {
                Book.create({ id: 457656121, genres: value });
            }).toThrowError('Failed to resolve many-to-many relationship: Book[genres] must be an array (passed: ' + value + ')');
        });
    });

    it('updating models without many-to-many entities works', function () {
        var _session33 = session,
            Book = _session33.Book;

        var book = Book.create({ id: 457656121 });
        expect(function () {
            book.update({ id: 457656121 });
        }).not.toThrowError();
    });

    it('update throws with non-array many field', function () {
        var _session34 = session,
            Book = _session34.Book;

        var book = Book.create({ id: 457656121 });
        [null, undefined, 353, 'a string'].forEach(function (value) {
            expect(function () {
                book.update({ genres: value });
            }).toThrowError('Failed to resolve many-to-many relationship: Book[genres] must be an array (passed: ' + value + ')');
        });
    });

    it('removing related many-to-many entities works', function () {
        var _session35 = session,
            Book = _session35.Book,
            Genre = _session35.Genre;

        var book = Book.withId(0);
        expect(book.genres.count()).toBe(2);
        book.genres.remove(Genre.withId(0));

        expect(session.Book.withId(0).genres.count()).toBe(1);
    });

    it('trying to remove unexisting related many-to-many entities throws', function () {
        var _session36 = session,
            Book = _session36.Book;

        var book = Book.withId(0);

        var unexistingId = 2012384;
        expect(function () {
            return book.genres.remove(0, unexistingId);
        }).toThrowError(unexistingId.toString());
    });

    it('clearing related many-to-many entities works', function () {
        var _session37 = session,
            Book = _session37.Book;

        var book = Book.withId(0);
        expect(book.genres.count()).toBe(2);
        book.genres.clear();

        expect(session.Book.withId(0).genres.count()).toBe(0);
    });

    it('foreign key relationship descriptors work', function () {
        var _session38 = session,
            Book = _session38.Book,
            Author = _session38.Author,
            Movie = _session38.Movie,
            Publisher = _session38.Publisher;

        // Forward

        var book = Book.first();
        var author = book.author;
        var rawFk = book.ref.author;

        expect(author).toBeInstanceOf(Author);
        expect(author.getId()).toBe(rawFk);

        // Backward
        var relatedBooks = author.books;
        expect(relatedBooks).toBeInstanceOf(_.QuerySet);
        relatedBooks._evaluate();
        expect(relatedBooks.rows).toContain(book.ref);
        expect(relatedBooks.modelClass).toBe(Book);

        // Forward with 'as' option
        var movie = Movie.first();
        var publisher = movie.publisher,
            publisherId = movie.publisherId;

        expect(publisher).toBeInstanceOf(Publisher);
        expect(publisher.getId()).toBe(publisherId);
    });

    it('non-existing foreign key relationship descriptors return null', function () {
        var _session39 = session,
            Book = _session39.Book,
            Author = _session39.Author;


        var book = Book.first();
        book.author = 91243424;
        expect(book.author).toBe(null);

        book.author = null;
        expect(book.author).toBe(null);
    });

    it('setting forwards foreign key (many-to-one) field works', function () {
        var _session40 = session,
            Book = _session40.Book,
            Author = _session40.Author,
            Movie = _session40.Movie,
            Publisher = _session40.Publisher;


        var book = Book.first();
        var newAuthor = Author.withId(2);

        book.author = newAuthor;

        expect(book.author).toEqual(newAuthor);
        expect(book.author.ref).toBe(newAuthor.ref);

        // with 'as' option
        var movie = Movie.first();
        var newPublisher = Publisher.withId(0);
        movie.publisher = newPublisher;

        expect(movie.publisherId).toEqual(0);
        expect(movie.publisher).toEqual(newPublisher);
        expect(movie.publisher.ref).toBe(newPublisher.ref);
    });

    it('trying to set backwards foreign key (reverse many-to-one) field throws', function () {
        var _session41 = session,
            Book = _session41.Book;


        var book = Book.first();
        expect(function () {
            book.author.books = 'whatever';
        }).toThrowError('Can\'t mutate a reverse many-to-one relation.');
    });

    it('one-to-one relationship descriptors work', function () {
        var _session42 = session,
            Book = _session42.Book,
            Cover = _session42.Cover;

        // Forward

        var book = Book.first();
        var cover = book.cover;
        var rawFk = book.ref.cover;

        expect(cover).toBeInstanceOf(Cover);
        expect(cover.getId()).toBe(rawFk);

        // Backward
        var relatedBook = cover.book;
        expect(relatedBook).toBeInstanceOf(Book);
        expect(relatedBook.getId()).toBe(book.getId());
    });

    it('trying to set backwards one-to-one field throws', function () {
        var _session43 = session,
            Book = _session43.Book,
            Cover = _session43.Cover;


        var book = Book.first();
        expect(function () {
            book.cover.book = 'whatever';
        }).toThrowError('Can\'t mutate a reverse one-to-one relation.');
    });

    it('applying no updates returns the same state reference', function () {
        var book = session.Book.first();
        book.name = book.name;

        expect(session.state).toBe(state);
    });

    it('Model works with default value', function () {
        var returnId = 1;

        var DefaultFieldModel = function (_Model) {
            (0, _inherits3.default)(DefaultFieldModel, _Model);

            function DefaultFieldModel() {
                (0, _classCallCheck3.default)(this, DefaultFieldModel);
                return (0, _possibleConstructorReturn3.default)(this, (DefaultFieldModel.__proto__ || (0, _getPrototypeOf2.default)(DefaultFieldModel)).apply(this, arguments));
            }

            return DefaultFieldModel;
        }(_.Model);

        DefaultFieldModel.fields = {
            id: (0, _.attr)({ getDefault: function getDefault() {
                    return returnId;
                } })
        };
        DefaultFieldModel.modelName = 'DefaultFieldModel';

        var _orm = new _.ORM();
        _orm.register(DefaultFieldModel);

        var sess = _orm.session(_orm.getEmptyState());
        sess.DefaultFieldModel.create({});

        expect(sess.DefaultFieldModel.idExists(1)).toBe(true);

        returnId = 999;
        sess.DefaultFieldModel.create({});
        expect(sess.DefaultFieldModel.idExists(999)).toBe(true);
    });
});