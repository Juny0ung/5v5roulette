import { describe, expect, it } from "vitest";
import { TeamDicider } from '../teamDicider';

describe('TeamDicider', () => {
    const teamDicider = new TeamDicider();

    teamDicider.addGroup();
    teamDicider.addGroup();

    teamDicider.setGroupMembers(0, '1a,1b,1c,1d,1e,1f');
    teamDicider.setGroupMembers(1, '2a,2b,2c,2d');
    
    it('Balanced_FromTop', () => {
        teamDicider.setLaneType('fromTop');

        teamDicider.updateTeams([], false);

        const winners = [
            { name: '1a', hue: 0 },
            { name: '2a', hue: 0 },
            { name: '1b', hue: 0 },
            { name: '1d', hue: 0 },
            { name: '1c', hue: 0 },
            { name: '1e', hue: 0 },
        ] as any;

        teamDicider.updateTeams(winners, false);

        const teamResult = (teamDicider as any)._teamResult;

        expect(teamResult[0]).toBe('1a');
        expect(teamResult[1]).toBe('2a');
        expect(teamResult[2]).toBe('1b');
        expect(teamResult[3]).toBe('1d');
        expect(teamResult[4]).toBe('');
        expect(teamResult[5]).toBe('1c');
        expect(teamResult[6]).toBe('');
        expect(teamResult[7]).toBe('1e');
        expect(teamResult[8]).toBe('');
        expect(teamResult[9]).toBe('');
    });

    teamDicider.setGroupMembers(0, '1a,1b,1c,1d,1e');
    teamDicider.setGroupMembers(1, '2a,2b,2c,2d,2e');

    it('Unbalanced_FromTop_Intermediate', () => {
        teamDicider.setLaneType('fromTop');

        teamDicider.updateTeams([], false);

        const winners = [
            { name: '1a', hue: 0 },
            { name: '2a', hue: 0 },
            { name: '2b', hue: 0 },
            { name: '1b', hue: 0 },
            { name: '1c', hue: 0 },
            { name: '1d', hue: 0 },
            { name: '2c', hue: 0 },
            { name: '1e', hue: 0 },
        ] as any;

        teamDicider.updateTeams(winners, false);

        const teamResult = (teamDicider as any)._teamResult;
        const remainders = (teamDicider as any)._remainders;

        expect(teamResult[0]).toBe('1a');
        expect(teamResult[1]).toBe('2a');
        expect(teamResult[2]).toBe('2b');
        expect(teamResult[3]).toBe('1b');
        expect(teamResult[4]).toBe('1c');

        expect(teamResult[5]).toBe('1d');
        expect(teamResult[6]).toBe('2c');
        expect(teamResult[7]).toBe('');
        expect(teamResult[8]).toBe('1e');
        expect(teamResult[9]).toBe('');

        expect(remainders.length).toBe(0);
    });

    it('Unbalanced_FromTop_NotFinished', () => {
        teamDicider.setLaneType('fromTop');

        teamDicider.updateTeams([], false);

        const winners = [
            { name: '1a', hue: 0 },
            { name: '2a', hue: 0 },
            { name: '2b', hue: 0 },
            { name: '1b', hue: 0 },
            { name: '1c', hue: 0 },
            { name: '1d', hue: 0 },
            { name: '2c', hue: 0 },
            { name: '1e', hue: 0 },
            { name: '2d', hue: 0 },
            { name: '2e', hue: 0 },
        ] as any;

        teamDicider.updateTeams(winners, false);

        const teamResult = (teamDicider as any)._teamResult;
        const remainders = (teamDicider as any)._remainders;

        expect(teamResult[0]).toBe('1a');
        expect(teamResult[1]).toBe('2a');
        expect(teamResult[2]).toBe('2b');
        expect(teamResult[3]).toBe('1b');
        expect(teamResult[4]).toBe('1c');

        expect(teamResult[5]).toBe('1d');
        expect(teamResult[6]).toBe('2c');
        expect(teamResult[7]).toBe('2d');
        expect(teamResult[8]).toBe('1e');
        expect(teamResult[9]).toBe('');

        expect(remainders.length).toBe(1);
    });

    it('Unbalanced_FromTop_Finished', () => {
        teamDicider.setLaneType('fromTop');

        teamDicider.updateTeams([], false);

        const winners = [
            { name: '1a', hue: 0 },
            { name: '2a', hue: 0 },
            { name: '2b', hue: 0 },
            { name: '1b', hue: 0 },
            { name: '1c', hue: 0 },
            { name: '1d', hue: 0 },
            { name: '2c', hue: 0 },
            { name: '1e', hue: 0 },
            { name: '2d', hue: 0 },
            { name: '2e', hue: 0 },
        ] as any;

        teamDicider.updateTeams(winners, true);

        const teamResult = (teamDicider as any)._teamResult;
        const remainders = (teamDicider as any)._remainders;

        expect(teamResult[0]).toBe('1a');
        expect(teamResult[1]).toBe('2a');
        expect(teamResult[2]).toBe('2b');
        expect(teamResult[3]).toBe('1b');
        expect(teamResult[4]).toBe('1c');

        expect(teamResult[5]).toBe('1d');
        expect(teamResult[6]).toBe('2c');
        expect(teamResult[7]).toBe('2d');
        expect(teamResult[8]).toBe('1e');
        expect(teamResult[9]).toBe('2e');

        expect(remainders.length).toBe(0);
    });
});
