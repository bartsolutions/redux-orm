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

describe('Many to many relationships', function () {
    var session = void 0;
    var orm = void 0;
    var state = void 0;

    describe('many-many forward/backward updates', function () {
        var Team = void 0;
        var User = void 0;
        var teamFirst = void 0;
        var userFirst = void 0;
        var userLast = void 0;
        var validateRelationState = void 0;

        beforeEach(function () {
            User = function (_Model) {
                (0, _inherits3.default)(User, _Model);

                function User() {
                    (0, _classCallCheck3.default)(this, User);
                    return (0, _possibleConstructorReturn3.default)(this, (User.__proto__ || (0, _getPrototypeOf2.default)(User)).apply(this, arguments));
                }

                return User;
            }(_.Model);
            User.modelName = 'User';
            User.fields = {
                id: (0, _.attr)(),
                name: (0, _.attr)(),
                subscribed: (0, _.many)('User', 'subscribers')
            };

            Team = function (_Model2) {
                (0, _inherits3.default)(Team, _Model2);

                function Team() {
                    (0, _classCallCheck3.default)(this, Team);
                    return (0, _possibleConstructorReturn3.default)(this, (Team.__proto__ || (0, _getPrototypeOf2.default)(Team)).apply(this, arguments));
                }

                return Team;
            }(_.Model);
            Team.modelName = 'Team';
            Team.fields = {
                id: (0, _.attr)(),
                name: (0, _.attr)(),
                users: (0, _.many)('User', 'teams')
            };

            orm = new _.ORM();
            orm.register(User, Team);
            session = orm.session();

            session.Team.create({ name: 'team0' });
            session.Team.create({ name: 'team1' });

            session.User.create({ name: 'user0' });
            session.User.create({ name: 'user1' });
            session.User.create({ name: 'user2' });

            teamFirst = session.Team.first();
            userFirst = session.User.first();
            userLast = session.User.last();

            validateRelationState = function validateRelationState() {
                var _session = session,
                    TeamUsers = _session.TeamUsers;


                teamFirst = session.Team.first();
                userFirst = session.User.first();
                userLast = session.User.last();

                expect(teamFirst.users.toRefArray().map(function (row) {
                    return row.id;
                })).toEqual([userFirst.id, userLast.id]);
                expect(userFirst.teams.toRefArray().map(function (row) {
                    return row.id;
                })).toEqual([teamFirst.id]);
                expect(userLast.teams.toRefArray().map(function (row) {
                    return row.id;
                })).toEqual([teamFirst.id]);

                expect(TeamUsers.count()).toBe(2);
            };
        });

        it('add forward many-many field', function () {
            teamFirst.users.add(userFirst, userLast);
            validateRelationState();
        });

        it('update forward many-many field', function () {
            teamFirst.update({ users: [userFirst, userLast] });
            validateRelationState();
        });

        it('add backward many-many field', function () {
            userFirst.teams.add(teamFirst);
            userLast.teams.add(teamFirst);
            validateRelationState();
        });

        it('update backward many-many field', function () {
            userFirst.update({ teams: [teamFirst] });
            userLast.update({ teams: [teamFirst] });
            validateRelationState();
        });

        it('create with forward many-many field', function () {
            session.Team.all().delete();
            session.User.all().delete();
            expect(session.Team.count()).toBe(0);
            expect(session.User.count()).toBe(0);
            expect(session.TeamUsers.count()).toBe(0);

            session.User.create({ name: 'user0' });
            session.User.create({ name: 'user1' });
            session.User.create({ name: 'user2' });

            session.Team.create({ name: 'team0', users: [session.User.first(), session.User.last()] });
            session.Team.create({ name: 'team1' });

            validateRelationState();
        });

        it('create with backward many-many field', function () {
            session.Team.all().delete();
            session.User.all().delete();
            expect(session.Team.count()).toBe(0);
            expect(session.User.count()).toBe(0);
            expect(session.TeamUsers.count()).toBe(0);

            session.Team.create({ name: 'team0' });
            session.Team.create({ name: 'team1' });

            session.User.create({ name: 'user0', teams: [session.Team.first()] });
            session.User.create({ name: 'user1' });
            session.User.create({ name: 'user2', teams: [session.Team.first()] });

            validateRelationState();
        });

        it('create with forward field with future many-many', function () {
            session.Team.all().delete();
            session.User.all().delete();
            expect(session.Team.count()).toBe(0);
            expect(session.User.count()).toBe(0);
            expect(session.TeamUsers.count()).toBe(0);

            session.Team.create({ id: 't0', users: ['u0', 'u2'] });
            session.Team.create({ id: 't1' });

            session.User.create({ id: 'u0' });
            session.User.create({ id: 'u1' });
            session.User.create({ id: 'u2' });

            validateRelationState();
        });

        it('create with backward field with future many-many', function () {
            session.Team.all().delete();
            session.User.all().delete();
            expect(session.Team.count()).toBe(0);
            expect(session.User.count()).toBe(0);
            expect(session.TeamUsers.count()).toBe(0);

            session.User.create({ id: 'u0', teams: ['t0'] });
            session.User.create({ id: 'u1' });
            session.User.create({ id: 'u2', teams: ['t0'] });

            session.Team.create({ id: 't0' });
            session.Team.create({ id: 't1' });

            validateRelationState();
        });

        it('create with forward field and existing backward many-many', function () {
            session.Team.all().delete();
            session.User.all().delete();
            expect(session.Team.count()).toBe(0);
            expect(session.User.count()).toBe(0);
            expect(session.TeamUsers.count()).toBe(0);

            session.User.create({ id: 'u0', teams: ['t0'] });
            session.User.create({ id: 'u1' });
            session.User.create({ id: 'u2', teams: ['t0'] });

            session.Team.create({ id: 't0', users: ['u0', 'u2'] });
            session.Team.create({ id: 't1' });

            validateRelationState();
        });

        it('create with backward field and existing forward many-many', function () {
            session.Team.all().delete();
            session.User.all().delete();
            expect(session.Team.count()).toBe(0);
            expect(session.User.count()).toBe(0);
            expect(session.TeamUsers.count()).toBe(0);

            session.Team.create({ id: 't0', users: ['u0', 'u2'] });
            session.Team.create({ id: 't1' });

            session.User.create({ id: 'u0', teams: ['t0'] });
            session.User.create({ id: 'u1' });
            session.User.create({ id: 'u2', teams: ['t0'] });

            validateRelationState();
        });
    });

    describe('many-many with a custom through model', function () {
        var validateRelationState = void 0;
        beforeEach(function () {
            validateRelationState = function validateRelationState() {
                var _session2 = session,
                    User = _session2.User,
                    Team = _session2.Team,
                    User2Team = _session2.User2Team;

                // Forward (from many-to-many field declaration)

                var user = User.get({ name: 'user0' });
                var relatedTeams = user.teams;

                expect(relatedTeams).toBeInstanceOf(_.QuerySet);
                expect(relatedTeams.modelClass).toBe(Team);
                expect(relatedTeams.count()).toBe(1);

                // Backward
                var team = Team.get({ name: 'team0' });
                var relatedUsers = team.users;

                expect(relatedUsers).toBeInstanceOf(_.QuerySet);
                expect(relatedUsers.modelClass).toBe(User);
                expect(relatedUsers.count()).toBe(2);

                expect(relatedUsers.toRefArray().map(function (row) {
                    return row.id;
                })).toEqual(['u0', 'u1']);
                expect(Team.withId('t2').users.toRefArray().map(function (row) {
                    return row.id;
                })).toEqual(['u1']);

                expect(relatedTeams.toRefArray().map(function (row) {
                    return row.id;
                })).toEqual([team.id]);
                expect(User.withId('u1').teams.toRefArray().map(function (row) {
                    return row.id;
                })).toEqual(['t0', 't2']);

                expect(User2Team.count()).toBe(3);
            };
        });

        it('without throughFields', function () {
            var UserModel = function (_Model3) {
                (0, _inherits3.default)(UserModel, _Model3);

                function UserModel() {
                    (0, _classCallCheck3.default)(this, UserModel);
                    return (0, _possibleConstructorReturn3.default)(this, (UserModel.__proto__ || (0, _getPrototypeOf2.default)(UserModel)).apply(this, arguments));
                }

                return UserModel;
            }(_.Model);
            UserModel.modelName = 'User';
            UserModel.fields = {
                id: (0, _.attr)(),
                name: (0, _.attr)()
            };
            var User2TeamModel = function (_Model4) {
                (0, _inherits3.default)(User2TeamModel, _Model4);

                function User2TeamModel() {
                    (0, _classCallCheck3.default)(this, User2TeamModel);
                    return (0, _possibleConstructorReturn3.default)(this, (User2TeamModel.__proto__ || (0, _getPrototypeOf2.default)(User2TeamModel)).apply(this, arguments));
                }

                return User2TeamModel;
            }(_.Model);
            User2TeamModel.modelName = 'User2Team';
            User2TeamModel.fields = {
                user: (0, _.fk)('User'),
                team: (0, _.fk)('Team')
            };
            var TeamModel = function (_Model5) {
                (0, _inherits3.default)(TeamModel, _Model5);

                function TeamModel() {
                    (0, _classCallCheck3.default)(this, TeamModel);
                    return (0, _possibleConstructorReturn3.default)(this, (TeamModel.__proto__ || (0, _getPrototypeOf2.default)(TeamModel)).apply(this, arguments));
                }

                return TeamModel;
            }(_.Model);
            TeamModel.modelName = 'Team';
            TeamModel.fields = {
                id: (0, _.attr)(),
                name: (0, _.attr)(),
                users: (0, _.many)({
                    to: 'User',
                    through: 'User2Team',
                    relatedName: 'teams'
                })
            };

            orm = new _.ORM();
            orm.register(UserModel, TeamModel, User2TeamModel);
            session = orm.session(orm.getEmptyState());
            var _session3 = session,
                User = _session3.User,
                Team = _session3.Team,
                User2Team = _session3.User2Team;


            Team.create({ id: 't0', name: 'team0' });
            Team.create({ id: 't1', name: 'team1' });
            Team.create({ id: 't2', name: 'team2' });

            User.create({ id: 'u0', name: 'user0', teams: ['t0'] });
            User.create({ id: 'u1', name: 'user1', teams: ['t0', 't2'] });

            validateRelationState();
        });

        it('with throughFields', function () {
            var UserModel = function (_Model6) {
                (0, _inherits3.default)(UserModel, _Model6);

                function UserModel() {
                    (0, _classCallCheck3.default)(this, UserModel);
                    return (0, _possibleConstructorReturn3.default)(this, (UserModel.__proto__ || (0, _getPrototypeOf2.default)(UserModel)).apply(this, arguments));
                }

                return UserModel;
            }(_.Model);
            UserModel.modelName = 'User';
            UserModel.fields = {
                id: (0, _.attr)(),
                name: (0, _.attr)()
            };
            var User2TeamModel = function (_Model7) {
                (0, _inherits3.default)(User2TeamModel, _Model7);

                function User2TeamModel() {
                    (0, _classCallCheck3.default)(this, User2TeamModel);
                    return (0, _possibleConstructorReturn3.default)(this, (User2TeamModel.__proto__ || (0, _getPrototypeOf2.default)(User2TeamModel)).apply(this, arguments));
                }

                return User2TeamModel;
            }(_.Model);
            User2TeamModel.modelName = 'User2Team';
            User2TeamModel.fields = {
                user: (0, _.fk)('User'),
                team: (0, _.fk)('Team')
            };
            var TeamModel = function (_Model8) {
                (0, _inherits3.default)(TeamModel, _Model8);

                function TeamModel() {
                    (0, _classCallCheck3.default)(this, TeamModel);
                    return (0, _possibleConstructorReturn3.default)(this, (TeamModel.__proto__ || (0, _getPrototypeOf2.default)(TeamModel)).apply(this, arguments));
                }

                return TeamModel;
            }(_.Model);
            TeamModel.modelName = 'Team';
            TeamModel.fields = {
                id: (0, _.attr)(),
                name: (0, _.attr)(),
                users: (0, _.many)({
                    to: 'User',
                    through: 'User2Team',
                    relatedName: 'teams',
                    throughFields: ['user', 'team']
                })
            };

            orm = new _.ORM();
            orm.register(UserModel, TeamModel, User2TeamModel);
            session = orm.session(orm.getEmptyState());
            var _session4 = session,
                User = _session4.User,
                Team = _session4.Team,
                User2Team = _session4.User2Team;


            Team.create({ id: 't0', name: 'team0' });
            Team.create({ id: 't1', name: 'team1' });
            Team.create({ id: 't2', name: 'team2' });

            User.create({ id: 'u0', name: 'user0', teams: ['t0'] });
            User.create({ id: 'u1', name: 'user1', teams: ['t0', 't2'] });

            validateRelationState();
        });

        it('with additional attributes', function () {
            var UserModel = function (_Model9) {
                (0, _inherits3.default)(UserModel, _Model9);

                function UserModel() {
                    (0, _classCallCheck3.default)(this, UserModel);
                    return (0, _possibleConstructorReturn3.default)(this, (UserModel.__proto__ || (0, _getPrototypeOf2.default)(UserModel)).apply(this, arguments));
                }

                return UserModel;
            }(_.Model);
            UserModel.modelName = 'User';
            UserModel.fields = {
                id: (0, _.attr)(),
                name: (0, _.attr)()
            };
            var User2TeamModel = function (_Model10) {
                (0, _inherits3.default)(User2TeamModel, _Model10);

                function User2TeamModel() {
                    (0, _classCallCheck3.default)(this, User2TeamModel);
                    return (0, _possibleConstructorReturn3.default)(this, (User2TeamModel.__proto__ || (0, _getPrototypeOf2.default)(User2TeamModel)).apply(this, arguments));
                }

                return User2TeamModel;
            }(_.Model);
            User2TeamModel.modelName = 'User2Team';
            User2TeamModel.fields = {
                user: (0, _.fk)('User', 'links'),
                team: (0, _.fk)('Team', 'links'),
                name: (0, _.attr)()
            };
            var TeamModel = function (_Model11) {
                (0, _inherits3.default)(TeamModel, _Model11);

                function TeamModel() {
                    (0, _classCallCheck3.default)(this, TeamModel);
                    return (0, _possibleConstructorReturn3.default)(this, (TeamModel.__proto__ || (0, _getPrototypeOf2.default)(TeamModel)).apply(this, arguments));
                }

                return TeamModel;
            }(_.Model);
            TeamModel.modelName = 'Team';
            TeamModel.fields = {
                id: (0, _.attr)(),
                name: (0, _.attr)(),
                users: (0, _.many)({
                    to: 'User',
                    through: 'User2Team',
                    relatedName: 'teams'
                })
            };

            orm = new _.ORM();
            orm.register(UserModel, TeamModel, User2TeamModel);
            session = orm.session(orm.getEmptyState());
            var _session5 = session,
                User = _session5.User,
                Team = _session5.Team,
                User2Team = _session5.User2Team;


            Team.create({ id: 't0', name: 'team0' });
            Team.create({ id: 't1', name: 'team1' });
            Team.create({ id: 't2', name: 'team2' });

            User.create({ id: 'u0', name: 'user0' });
            User.create({ id: 'u1', name: 'user1' });

            User2Team.create({ user: 'u0', team: 't0', name: 'link0' });
            User2Team.create({ user: 'u1', team: 't0', name: 'link1' });
            User2Team.create({ user: 'u1', team: 't2', name: 'link2' });

            validateRelationState();

            expect(User.withId('u0').links.toRefArray().map(function (row) {
                return row.name;
            })).toEqual(['link0']);
            expect(User.withId('u1').links.toRefArray().map(function (row) {
                return row.name;
            })).toEqual(['link1', 'link2']);
        });

        it('throws if self-referencing relationship without throughFields', function () {
            var UserModel = function (_Model12) {
                (0, _inherits3.default)(UserModel, _Model12);

                function UserModel() {
                    (0, _classCallCheck3.default)(this, UserModel);
                    return (0, _possibleConstructorReturn3.default)(this, (UserModel.__proto__ || (0, _getPrototypeOf2.default)(UserModel)).apply(this, arguments));
                }

                return UserModel;
            }(_.Model);
            UserModel.modelName = 'User';
            UserModel.fields = {
                id: (0, _.attr)(),
                name: (0, _.attr)(),
                users: (0, _.many)({
                    to: 'User',
                    through: 'User2User',
                    relatedName: 'otherUsers'
                })
            };
            var User2UserModel = function (_Model13) {
                (0, _inherits3.default)(User2UserModel, _Model13);

                function User2UserModel() {
                    (0, _classCallCheck3.default)(this, User2UserModel);
                    return (0, _possibleConstructorReturn3.default)(this, (User2UserModel.__proto__ || (0, _getPrototypeOf2.default)(User2UserModel)).apply(this, arguments));
                }

                return User2UserModel;
            }(_.Model);
            User2UserModel.modelName = 'User2User';
            User2UserModel.fields = {
                id: (0, _.attr)(),
                name: (0, _.attr)()
            };

            orm = new _.ORM();
            expect(function () {
                orm.register(UserModel, User2UserModel);
            }).toThrowError('Self-referencing many-to-many relationship at "User.users" using custom model "User2User" has no throughFields key. Cannot determine which fields reference the instances partaking in the relationship.');
        });
    });

    describe('self-referencing many field with "this" as toModelName', function () {
        beforeEach(function () {
            var _createTestSessionWit = (0, _helpers.createTestSessionWithData)();

            session = _createTestSessionWit.session;
            orm = _createTestSessionWit.orm;
            state = _createTestSessionWit.state;
        });

        it('adds relationships correctly when toModelName is "this"', function () {
            var _session6 = session,
                Tag = _session6.Tag,
                TagSubTags = _session6.TagSubTags;

            expect(TagSubTags.count()).toBe(0);
            Tag.withId('Technology').subTags.add('Redux');
            expect(TagSubTags.all().toRefArray()).toEqual([{
                id: 0,
                fromTagId: 'Technology',
                toTagId: 'Redux'
            }]);
            expect(Tag.withId('Technology').subTags.count()).toBe(1);
            expect(Tag.withId('Technology').subTags.toRefArray()).toEqual([Tag.withId('Redux').ref]);

            expect(Tag.withId('Redux').subTags.count()).toBe(0);
            expect(Tag.withId('Redux').subTags.toRefArray()).toEqual([]);
        });

        it('removes relationships correctly when toModelName is "this"', function () {
            var _session7 = session,
                Tag = _session7.Tag,
                TagSubTags = _session7.TagSubTags;

            Tag.withId('Technology').subTags.add('Redux');
            Tag.withId('Redux').subTags.add('Technology');

            Tag.withId('Redux').subTags.remove('Technology');

            expect(Tag.withId('Technology').subTags.toRefArray()).toEqual([Tag.withId('Redux').ref]);
            expect(TagSubTags.all().toRefArray()).toEqual([{
                id: 0,
                fromTagId: 'Technology',
                toTagId: 'Redux'
            }]);
            expect(Tag.withId('Technology').subTags.count()).toBe(1);
            expect(Tag.withId('Redux').subTags.toRefArray()).toEqual([]);
            expect(Tag.withId('Redux').subTags.count()).toBe(0);
        });

        it('querying backwards relationships works when toModelName is "this"', function () {
            var _session8 = session,
                Tag = _session8.Tag;

            Tag.withId('Technology').subTags.add('Redux');

            expect(Tag.withId('Redux').parentTags.toRefArray()).toEqual([Tag.withId('Technology').ref]);
            expect(Tag.withId('Redux').parentTags.count()).toBe(1);
            expect(Tag.withId('Technology').parentTags.toRefArray()).toEqual([]);
            expect(Tag.withId('Technology').parentTags.count()).toBe(0);
        });

        it('adding relationships via backwards descriptor works when toModelName is "this"', function () {
            var _session9 = session,
                Tag = _session9.Tag;

            Tag.withId('Redux').parentTags.add('Technology');

            expect(Tag.withId('Redux').parentTags.toRefArray()).toEqual([Tag.withId('Technology').ref]);
            expect(Tag.withId('Redux').parentTags.count()).toBe(1);
            expect(Tag.withId('Technology').subTags.toRefArray()).toEqual([Tag.withId('Redux').ref]);
            expect(Tag.withId('Technology').subTags.count()).toBe(1);
        });

        it('removing relationships via backwards descriptor works when toModelName is "this"', function () {
            var _session10 = session,
                Tag = _session10.Tag,
                TagSubTags = _session10.TagSubTags;

            Tag.withId('Technology').subTags.add('Redux');
            Tag.withId('Redux').subTags.add('Technology');

            Tag.withId('Technology').parentTags.remove('Redux');

            expect(Tag.withId('Technology').subTags.toRefArray()).toEqual([Tag.withId('Redux').ref]);
            expect(TagSubTags.all().toRefArray()).toEqual([{
                id: 0,
                fromTagId: 'Technology',
                toTagId: 'Redux'
            }]);
            expect(Tag.withId('Technology').subTags.count()).toBe(1);
            expect(Tag.withId('Redux').subTags.toRefArray()).toEqual([]);
            expect(Tag.withId('Redux').subTags.count()).toBe(0);
        });
    });

    describe('self-referencing many field with modelName as toModelName', function () {
        var User = void 0;
        var user0 = void 0;
        var user1 = void 0;
        var user2 = void 0;
        var validateRelationState = void 0;

        beforeEach(function () {
            User = function (_Model14) {
                (0, _inherits3.default)(User, _Model14);

                function User() {
                    (0, _classCallCheck3.default)(this, User);
                    return (0, _possibleConstructorReturn3.default)(this, (User.__proto__ || (0, _getPrototypeOf2.default)(User)).apply(this, arguments));
                }

                return User;
            }(_.Model);
            User.modelName = 'User';
            User.fields = {
                id: (0, _.attr)(),
                subscribed: (0, _.many)('User', 'subscribers')
            };
            orm = new _.ORM();
            orm.register(User);
            session = orm.session();

            session.User.create({ id: 'u0' });
            session.User.create({ id: 'u1' });
            session.User.create({ id: 'u2' });

            user0 = session.User.withId('u0');
            user1 = session.User.withId('u1');
            user2 = session.User.withId('u2');

            validateRelationState = function validateRelationState() {
                var _session11 = session,
                    UserSubscribed = _session11.UserSubscribed;


                user0 = session.User.withId('u0');
                user1 = session.User.withId('u1');
                user2 = session.User.withId('u2');

                expect(user0.subscribed.toRefArray().map(function (row) {
                    return row.id;
                })).toEqual(['u2']);
                expect(user1.subscribed.toRefArray().map(function (row) {
                    return row.id;
                })).toEqual(['u0', 'u2']);
                expect(user2.subscribed.toRefArray().map(function (row) {
                    return row.id;
                })).toEqual(['u1']);

                expect(UserSubscribed.count()).toBe(4);
            };
        });

        it('add forward many-many field', function () {
            user0.subscribed.add(user2);
            user1.subscribed.add(user0, user2);
            user2.subscribed.add(user1);
            validateRelationState();
        });

        it('update forward many-many field', function () {
            user0.update({ subscribed: [user2] });
            user1.update({ subscribed: [user0, user2] });
            user2.update({ subscribed: [user1] });
            validateRelationState();
        });

        it('add backward many-many field', function () {
            user0.subscribers.add(user1);
            user1.subscribers.add(user2);
            user2.subscribers.add(user0, user1);
            validateRelationState();
        });

        it('update backward many-many field', function () {
            user0.update({ subscribers: [user1] });
            user1.update({ subscribers: [user2] });
            user2.update({ subscribers: [user0, user1] });
            validateRelationState();
        });

        it('create with forward many-many field', function () {
            session.User.all().delete();
            expect(session.User.count()).toBe(0);
            expect(session.UserSubscribed.count()).toBe(0);

            session.User.create({ id: 'u0', subscribed: ['u2'] });
            session.User.create({ id: 'u1', subscribed: ['u0', 'u2'] });
            session.User.create({ id: 'u2', subscribed: ['u1'] });

            validateRelationState();
        });

        it('create with backward many-many field', function () {
            session.User.all().delete();
            expect(session.User.count()).toBe(0);
            expect(session.UserSubscribed.count()).toBe(0);

            session.User.create({ id: 'u0', subscribers: ['u1'] });
            session.User.create({ id: 'u1', subscribers: ['u2'] });
            session.User.create({ id: 'u2', subscribers: ['u0', 'u1'] });

            validateRelationState();
        });
    });
});