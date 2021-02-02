'use strict';

const chai = require('chai');
const { expect } = chai;
const fs = require('fs');

const { isConsideredVersion, ltsVersions, isLtsOrLatest } = require('../lib/lts/index');

describe('ember LTS based policy', function () {
  describe('ltsVersions', function () {
    describe('isConsideredVersion', function () {
      it('works', function () {
        expect(isConsideredVersion('')).to.eql(false);
        expect(isConsideredVersion('0')).to.eql(false);
        expect(isConsideredVersion('0.')).to.eql(false);
        expect(isConsideredVersion('0.0')).to.eql(false);
        expect(isConsideredVersion('0.0.')).to.eql(false);
        expect(isConsideredVersion('0.0.0')).to.eql(true);
        expect(isConsideredVersion('1111111111.11111111111111.111111111111')).to.eql(true);
        expect(isConsideredVersion('1111111111.11111111111111.111111111111-alpha.1')).to.eql(false);
        expect(isConsideredVersion('1111111111.11111111111111.111111111111-alpha.2')).to.eql(false);
        expect(isConsideredVersion('1111111111.11111111111111.beta.2')).to.eql(false);
        expect(isConsideredVersion('created')).to.eql(false);
        expect(isConsideredVersion('modified')).to.eql(false);
      });
    });

    it('works with empty-ish input', function () {
      expect(ltsVersions({}, new Date())).to.eql([]);
    });

    it('every four minor versions', function () {
      const ltsBeginsAt = new Date('1986-06-16');
      expect(
        ltsVersions(
          {
            '1.0.0': ltsBeginsAt,
            '1.1.0': ltsBeginsAt,
            '1.1.1': ltsBeginsAt,
            '1.1.2': ltsBeginsAt,
            '1.1.3': ltsBeginsAt,
            '1.1.4': ltsBeginsAt,
            '1.1.5': ltsBeginsAt,
            '1.2.0': ltsBeginsAt,
            '1.3.0': ltsBeginsAt, // <-- LTS
            '1.4.0': ltsBeginsAt,
            '1.5.0': ltsBeginsAt,
            '1.6.0': ltsBeginsAt,
            '1.7.0': ltsBeginsAt, // <-- LTS
            '1.8.0': ltsBeginsAt,
            '1.9.0': ltsBeginsAt,
            '1.10.0': ltsBeginsAt,
            '1.11.0': ltsBeginsAt, // <-- LTS
            '1.12.0': ltsBeginsAt,
            '1.13.0': ltsBeginsAt,
            '1.14.0': ltsBeginsAt,
            '1.15.0': ltsBeginsAt, // <-- LTS
            '1.16.0': ltsBeginsAt,
            '1.17.0': ltsBeginsAt,
            '1.18.0': ltsBeginsAt,
            '1.19.0': ltsBeginsAt, // <-- LTS
            '1.20.0': ltsBeginsAt,
          },
          ltsBeginsAt,
        ),
      ).to.eql([
        {
          latestVersion: '1.4.0',
          version: '1.4.0',
          ltsBeginsAt,
        },
        {
          latestVersion: '1.8.0',
          version: '1.8.0',
          ltsBeginsAt,
        },
        {
          latestVersion: '1.12.0',
          version: '1.12.0',
          ltsBeginsAt,
        },
        {
          latestVersion: '1.16.0',
          version: '1.16.0',
          ltsBeginsAt,
        },
        {
          latestVersion: '1.20.0',
          version: '1.20.0',
          ltsBeginsAt,
        },
      ]);
    });

    it('last minor, before major', function () {
      const ltsBeginsAt = new Date('1986-09-16');
      expect(
        ltsVersions(
          {
            '1.0.0': ltsBeginsAt,
          },
          ltsBeginsAt,
        ),
      ).to.eql([]);

      expect(
        ltsVersions(
          {
            '0.9.0': ltsBeginsAt,
            '0.9.9': ltsBeginsAt,
            '1.0.0': ltsBeginsAt,
            '2.9.9': ltsBeginsAt,
            '2.9.0': ltsBeginsAt,
            '3.0.0': ltsBeginsAt,
          },
          ltsBeginsAt,
        ),
      ).to.eql([
        {
          version: '0.9.0',
          latestVersion: '0.9.9',
          ltsBeginsAt,
        },
        {
          version: '1.0.0',
          latestVersion: '1.0.0',
          ltsBeginsAt,
        },
        {
          version: '2.9.0',
          latestVersion: '2.9.9',
          ltsBeginsAt,
        },
      ]);
    });

    it('considers an LTS supported for at-most 54 weeks', function () {
      const ltsBeginsAt = new Date('1986-09-16');
      // base-case
      expect(
        ltsVersions(
          {
            '0.9.0': ltsBeginsAt, // last before major
            '1.0.0': ltsBeginsAt,
            '1.1.0': ltsBeginsAt,
            '1.2.0': ltsBeginsAt,
            '1.3.0': ltsBeginsAt, // 4th minor
            '1.4.0': ltsBeginsAt,
            '1.5.0': ltsBeginsAt,
          },
          ltsBeginsAt,
        ),
      ).to.eql([
        {
          version: '0.9.0',
          latestVersion: '0.9.0',
          ltsBeginsAt,
        },
        {
          version: '1.4.0',
          latestVersion: '1.4.0',
          ltsBeginsAt,
        },
      ]);

      // 54 weeks latest, we should no longer have any LTS
      const fiftyFourWeeksLater = new Date(ltsBeginsAt);
      fiftyFourWeeksLater.setDate(fiftyFourWeeksLater.getDate() + 54 * 7);

      expect(
        ltsVersions(
          {
            '0.9.0': ltsBeginsAt, // last before major
            '1.0.0': ltsBeginsAt,
            '1.1.0': ltsBeginsAt,
            '1.2.0': ltsBeginsAt,
            '1.3.0': ltsBeginsAt, // 4th minor
            '1.4.0': ltsBeginsAt,
          },
          fiftyFourWeeksLater,
        ),
      ).to.eql([
        {
          latestVersion: '0.9.0',
          ltsBeginsAt,
          version: '0.9.0',
        },
        {
          latestVersion: '1.4.0',
          ltsBeginsAt,
          version: '1.4.0',
        },
      ]);
    });

    it('test against real ember-source versions', function () {
      const { time } = JSON.parse(
        fs.readFileSync(`${__dirname}/fixtures/recordings/default/ember-source.json`, 'utf-8'),
      );

      expect(ltsVersions(time, new Date('1986-09-16'))).to.eql([]);
      expect(ltsVersions(time, new Date('2020-12-01'))).to.eql([
        {
          latestVersion: '3.16.10',
          ltsBeginsAt: new Date('2020-01-20T22:56:00.185Z'),
          version: '3.16.0',
        },
        {
          latestVersion: '3.20.6',
          ltsBeginsAt: new Date('2020-07-13T19:25:13.104Z'),
          version: '3.20.0',
        },
      ]);
    });
  });

  describe('isLtsOrLatest', function () {
    it('resolved version is LTS', function() {
      expect(isLtsOrLatest({}, '3.16.0')).to.eql({
        isSupported: true,
        message: 'Using maintenance LTS. Update to latest LTS'
      });
    });
    it('resolved version is older version', function() {
      expect(isLtsOrLatest({}, '3.14.0')).to.eql({
        isSupported: false,
        message: 'Voilated: ember-cli needs to be on v3.20.* or above LTS versions.'
      });
    });
    it('Above maintenance LTS, update to next LTS', function() {
      expect(isLtsOrLatest({}, '3.18.0')).to.eql({
        isSupported: false,
        message: 'Voilated: ember-cli needs to be on v3.20.* or above LTS versions.'
      });
    });
    it('resolved version is LTS latest', function() {
      expect(isLtsOrLatest({}, '3.20.0')).to.eql({
        isSupported: true,
      });
    });
    it('resolved version is LTS', function() {
      expect(isLtsOrLatest({}, '3.25.0')).to.eql({
        isSupported: true,
      });
    });
  });
});
