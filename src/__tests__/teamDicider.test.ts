import { describe, expect, it } from "vitest";
import { TeamDicider } from '../teamDicider';

function testLaneResult(teamDicider: TeamDicider): any {
    const winners = [
        { name: 'jg', hue: 0 }, 
        { name: 'adc', hue: 0 }, 
        { name: 'sup', hue: 0 }
    ] as any;
    teamDicider.updateTeams(winners, false);
    const laneResult1 = (teamDicider as any)._laneResult;
    expect(laneResult1).toEqual([1, 3, 4]);

    winners.push(...[
        { name: 'mid', hue: 0 }, 
        { name: 'top', hue: 0 }
    ]);
    teamDicider.updateTeams(winners, false);
    const laneResult2 = (teamDicider as any)._laneResult;
    expect(laneResult2).toEqual([1, 3, 4, 2, 0]);

    return winners;
}

function testResult(teamDicider: TeamDicider, winners: any,
    result1: string[], 
    result2: string[],
    result3: string[]) {

    teamDicider.updateTeams([], false);

    winners.push(...[
        { name: 'a', hue: 0 }, 
        { name: 'f', hue: 0 }, 
        { name: 'g', hue: 0 }, 
        { name: 'b', hue: 0 }, 
        { name: 'c', hue: 0 }, 
        { name: 'h', hue: 0 }, 
        { name: 'd', hue: 0 } 
    ]);
    teamDicider.updateTeams(winners, false);
    const teamResult1 = (teamDicider as any)._teamResult;
    expect(teamResult1).toEqual(result1);

    winners.push(...[{ name: 'i', hue: 0 }, { name: 'j', hue: 0 }]);
    teamDicider.updateTeams(winners, false);
    const teamResult2 = (teamDicider as any)._teamResult;
    expect(teamResult2).toEqual(result2);

    winners.push({ name: 'e', hue: 0 });
    teamDicider.updateTeams(winners, true);
    const teamResult3 = (teamDicider as any)._teamResult;
    expect(teamResult3).toEqual(result3);
}

describe('Balanced', () => {
    const teamDicider = new TeamDicider();

    teamDicider.setMeetBalance(true);
    teamDicider.calculatePossibleResults(
        ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'],
        new Map<number, string[]>([
            [0, ['a', 'b', 'c', 'd', 'e', 'f']],
            [1, ['g', 'h', 'i', 'j']]
        ]),
        new Map<number, string[]>()
    );

    it('FromTop', () => {
        teamDicider.setLaneType('fromTop');
        testResult(teamDicider, [],
            ['a', 'f', 'g', 'b', 'h', 'c', 'd', '', '', ''],
            ['a', 'f', 'g', 'b', 'h', 'c', 'd', 'i', '', 'j'],
            ['a', 'f', 'g', 'b', 'h', 'c', 'd', 'i', 'e', 'j']
        );
    });

    it('FixedLane_AllFixed', () => {
        return;
        teamDicider.setLaneType('fixed');
        teamDicider.setFixedLanes([0, 1, 0, 1, 0]);
        testResult(teamDicider, [],
            ['a', 'g', 'f', 'h', 'b', 'c', '', 'd', '', ''],
            ['a', 'g', 'f', 'h', 'b', 'c', 'i', 'd', 'j', ''],
            ['a', 'g', 'f', 'h', 'b', 'c', 'i', 'd', 'j', 'e']
        );
    });

    it('FixedLane_PartFixed', () => {
        return;
        teamDicider.setLaneType('fixed');
        teamDicider.setFixedLanes([0, 1, -1, 1, 0]);
        testResult(teamDicider, [],
            ['a', 'g', '', 'h', 'f', 'b', '', '', '', 'c'],
            ['a', 'g', '', 'h', 'f', 'b', 'i', '', 'j', 'c'],
            ['a', 'g', 'd', 'h', 'f', 'b', 'i', 'e', 'j', 'c']
        );
    });

    it('Random', () => {
        teamDicider.setLaneType('random');
        const winners: any = testLaneResult(teamDicider);
        testResult(teamDicider, winners,
            ['a', 'f', 'g', 'b', 'h', 'c', 'd', '', '', ''],
            ['a', 'f', 'g', 'b', 'h', 'c', 'd', 'i', '', 'j'],
            ['a', 'f', 'g', 'b', 'h', 'c', 'd', 'i', 'e', 'j']
        );
    });
});

describe('Unbalanced', () => {
    const teamDicider = new TeamDicider();

    teamDicider.setMeetBalance(true);
    teamDicider.calculatePossibleResults(
        ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'],
        new Map<number, string[]>([
            [0, ['a', 'b', 'c', 'd', 'e']],
            [1, ['f', 'g', 'h', 'i', 'j']]
        ]),
        new Map<number, string[]>()
    );

    it('FromTop', () => {
        teamDicider.setLaneType('fromTop');
        testResult(teamDicider, [],
            ['a', 'f', 'g', 'b', 'c', 'd', 'h', '', '', ''],
            ['a', 'f', 'g', 'b', 'c', 'd', 'h', 'i', 'j', ''],
            ['a', 'f', 'g', 'b', 'c', 'd', 'h', 'i', 'j', 'e']
        );
    });

    it('FixedLane_AllFixed', () => {
        return;
        teamDicider.setLaneType('fixed');
        teamDicider.setFixedLanes([0, 1, 0, 1, 0]);
        testResult(teamDicider, [],
            ['a', 'f', 'b', 'g', 'c', 'd', 'h', '', '', ''],
            ['a', 'f', 'b', 'g', 'c', 'd', 'h', '', 'i', ''],
            ['a', 'f', 'b', 'g', 'c', 'd', 'h', 'e', 'i', 'j']
        );
    });

    it('FixedLane_PartFixed', () => {
        return;
        teamDicider.setLaneType('fixed');
        teamDicider.setFixedLanes([0, 1, -1, 1, 0]);
        testResult(teamDicider, [],
            ['a', 'f', '', 'g', 'b', 'c', 'h', '', '', 'd'],
            ['a', 'f', '', 'g', 'b', 'c', 'h', '', 'i', 'd'],
            ['a', 'f', 'j', 'g', 'b', 'c', 'h', 'e', 'i', 'd']
        );
    });

    it('Random', () => {
        teamDicider.setLaneType('random');
        const winners: any = testLaneResult(teamDicider);
        testResult(teamDicider, winners,
            ['a', 'f', 'g', 'b', 'c', 'd', 'h', '', '', ''],
            ['a', 'f', 'g', 'b', 'c', 'd', 'h', 'i', 'j', ''],
            ['a', 'f', 'g', 'b', 'c', 'd', 'h', 'i', 'j', 'e']
        );
    });
});
