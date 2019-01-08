'use strict';

var _fields = require('../../fields');

describe('Fields', function () {
    describe('ManyToMany', function () {
        describe('getDefault', function () {
            it('returns empty array', function () {
                var m2m = new _fields.ManyToMany();
                expect(m2m.getDefault()).toEqual([]);
            });
        });
    });
});