import { describe, expect, it } from "vitest";
import { TeamDicider } from '../teamdicider';

describe('TeamDicider', () => {
    const teamDicider = new TeamDicider();

    teamDicider.addGroup();
    teamDicider.addGroup();

    teamDicider.setGroupMembers(0, 'a,b,c,d,e,f');
    teamDicider.setGroupMembers(1, 'g,h,i,j');
    
    it('Balanced_FromTop', () => {
        teamDicider.setLaneType('fromTop');

        teamDicider.updateTeams([], false);

        const winners = [
            { name: 'a', hue: 0 },
            { name: 'g', hue: 0 },
            { name: 'b', hue: 0 },
            { name: 'd', hue: 0 },
            { name: 'c', hue: 0 },
            { name: 'e', hue: 0 },
        ] as any;

        teamDicider.updateTeams(winners, false);

        const teamResult = (teamDicider as any)._teamResult;

        expect(teamResult[0]).toBe('a');
        expect(teamResult[1]).toBe('g');
        expect(teamResult[2]).toBe('b');
        expect(teamResult[3]).toBe('d');
        expect(teamResult[4]).toBe('');
        expect(teamResult[5]).toBe('c');
        expect(teamResult[6]).toBe('');
        expect(teamResult[7]).toBe('e');
        expect(teamResult[8]).toBe('');
        expect(teamResult[9]).toBe('');
    });

    teamDicider.setGroupMembers(0, 'a,b,c,d,e');
    teamDicider.setGroupMembers(1, 'f,g,h,i,j');

    it('Unbalanced_FromTop_Intermediate', () => {
        teamDicider.setLaneType('fromTop');

        teamDicider.updateTeams([], false);

        const winners = [
            { name: 'a', hue: 0 },
            { name: 'f', hue: 0 },
            { name: 'g', hue: 0 },
            { name: 'b', hue: 0 },
            { name: 'c', hue: 0 },
            { name: 'd', hue: 0 },
            { name: 'h', hue: 0 },
            { name: 'e', hue: 0 },
        ] as any;

        teamDicider.updateTeams(winners, false);

        const teamResult = (teamDicider as any)._teamResult;
        const remainders = (teamDicider as any)._remainders;

        expect(teamResult[0]).toBe('a');
        expect(teamResult[1]).toBe('f');
        expect(teamResult[2]).toBe('g');
        expect(teamResult[3]).toBe('b');
        expect(teamResult[4]).toBe('c');
        expect(teamResult[5]).toBe('d');
        expect(teamResult[6]).toBe('h');
        expect(teamResult[7]).toBe('');
        expect(teamResult[8]).toBe('e');
        expect(teamResult[9]).toBe('');

        expect(remainders.length).toBe(0);
    });

    it('Unbalanced_FromTop_NotFinished', () => {
        teamDicider.setLaneType('fromTop');

        teamDicider.updateTeams([], false);

        const winners = [
            { name: 'a', hue: 0 },
            { name: 'f', hue: 0 },
            { name: 'g', hue: 0 },
            { name: 'b', hue: 0 },
            { name: 'c', hue: 0 },
            { name: 'd', hue: 0 },
            { name: 'h', hue: 0 },
            { name: 'e', hue: 0 },
            { name: 'i', hue: 0 },
            { name: 'j', hue: 0 },
        ] as any;

        teamDicider.updateTeams(winners, false);

        const teamResult = (teamDicider as any)._teamResult;
        const remainders = (teamDicider as any)._remainders;

        expect(teamResult[0]).toBe('a');
        expect(teamResult[1]).toBe('f');
        expect(teamResult[2]).toBe('g');
        expect(teamResult[3]).toBe('b');
        expect(teamResult[4]).toBe('c');
        expect(teamResult[5]).toBe('d');
        expect(teamResult[6]).toBe('h');
        expect(teamResult[7]).toBe('i');
        expect(teamResult[8]).toBe('e');
        expect(teamResult[9]).toBe('');

        expect(remainders.length).toBe(1);
    });

    it('Unbalanced_FromTop_Finished', () => {
        teamDicider.setLaneType('fromTop');

        teamDicider.updateTeams([], false);

        const winners = [
            { name: 'a', hue: 0 },
            { name: 'f', hue: 0 },
            { name: 'g', hue: 0 },
            { name: 'b', hue: 0 },
            { name: 'c', hue: 0 },
            { name: 'd', hue: 0 },
            { name: 'h', hue: 0 },
            { name: 'e', hue: 0 },
            { name: 'i', hue: 0 },
            { name: 'j', hue: 0 },
        ] as any;

        teamDicider.updateTeams(winners, true);

        const teamResult = (teamDicider as any)._teamResult;
        const remainders = (teamDicider as any)._remainders;

        expect(teamResult[0]).toBe('a');
        expect(teamResult[1]).toBe('f');
        expect(teamResult[2]).toBe('g');
        expect(teamResult[3]).toBe('b');
        expect(teamResult[4]).toBe('c');
        expect(teamResult[5]).toBe('d');
        expect(teamResult[6]).toBe('h');
        expect(teamResult[7]).toBe('i');
        expect(teamResult[8]).toBe('e');
        expect(teamResult[9]).toBe('j');

        expect(remainders.length).toBe(0);
    });
});
