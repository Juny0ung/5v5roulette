import { Marble } from './marble';
import { RenderParameters } from './rouletteRenderer';
import { Rect } from './types/rect.type';
import { UIObject } from './UIObject';
import { translateText } from './localization';
import { getTeamSettingSnapshot, getMeetBalance } from './teamsetting/teamsetting';
import { nodeInside, NodeData, AreaData, AreaType } from './teamsetting/types'

enum LaneType {
    FromTop = 0,
    FixedLane,  // TODO
    Random
}

type TeamResult = {
    team1: string[];
    team2: string[];
};

export class TeamDicider implements UIObject {
    private _balanceMap: Map<string, number> = new Map();
    private _candidateResults: TeamResult[] = [];

    private _meetBalance: boolean = false;

    private _laneType: LaneType = LaneType.FromTop;
    // designated lane groups if type is FixedLane. -1 === any group. it can be longer than 5 if each side assigned to different group
    private _laneGroups: number[] = [];

    private _winners: string = '';
    private _teamResult: string[] = new Array(10).fill('');
    // lane result for random
    private _laneResult: number[] = [];

    // for render
    private fontHeight = 16;

    private readonly lanes: string[] = ['top', 'jg', 'mid', 'adc', 'sup'];

    constructor() {
        this.resetTeamResult();
    }

    update(deltaTime: number): void {
        
    }

    render(
        ctx: CanvasRenderingContext2D, 
        { marbles, winners, theme }: RenderParameters, 
        width: number, 
        height: number
    ): void {
        this.updateTeams(winners, marbles.length === 0);

        const startX = width - 75;
        const startY = height - this.fontHeight * 9;
        const maxY = this.fontHeight * 7;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = '10pt sans-serif';
        ctx.fillStyle = '#666';

        ctx.beginPath();
        ctx.rect(width - 150, startY, width, startY + maxY);
        ctx.clip();

        ctx.translate(0, startY);
        ctx.font = 'bold 11pt sans-serif';
        if (theme.rankStroke) {
            ctx.lineWidth = 2;
            ctx.strokeStyle = theme.rankStroke;
        }

        const teamResultText = translateText('Team Result');
        ctx.strokeText(teamResultText, startX, 20);
        ctx.fillText(teamResultText, startX, 20);

        ctx.font = 'bold 10pt sans-serif'
        ctx.fillStyle = '#0000CD';
        const BlueTeamText = translateText('Blue');
        ctx.strokeText(BlueTeamText, startX - 35, 40);
        ctx.fillText(BlueTeamText, startX - 35, 40);
        ctx.fillStyle = '#B22222';
        const RedTeamText = translateText('Red');
        ctx.strokeText(RedTeamText, startX + 35, 40);
        ctx.fillText(RedTeamText, startX + 35, 40);

        const getFillStyle = (name: string): string => {
            if (name.length > 0) {
                for (const marble of winners) {
                    if (marble.name === name) {
                        return `hsl(${marble.hue} 100% ${theme.marbleLightness}`;
                    }
                }
            }
            
            return '#666';
        };

        const getEmptyMemberStr = (lane: number): string => {
            return '--';
        }

        const getLaneIndex = (index: number): number => {
            if (this._laneType !== LaneType.Random) {
                return index;
            }

            if (index < this._laneResult.length) {
                return this._laneResult[index];
            }

            const used: boolean[] = new Array(5).fill(false);
            for (const laneResult of this._laneResult) {
                used[laneResult] = true;
            }
            
            let remainCnt = index - this._laneResult.length;
            for (let i = 0; i < 5; i++) {
                if (!used[i]) {
                    if (remainCnt === 0) {
                        return i;
                    }
                    remainCnt--;
                } 
            }
            
            return -1;
        }

        const getLaneText = (laneIndex: number): string => {
            if (this._laneType !== LaneType.Random || this._laneResult.includes(laneIndex)) {
                return translateText(this.lanes[laneIndex]);
            }

            return '--';
        }
        
        ctx.font = '10pt sans-serif'
        ctx.fillStyle = '#666';

        for (let index = 0; index < 5; index++) {
            const laneIndex = getLaneIndex(index);
            const posY = 58 + laneIndex * this.fontHeight;
            const team1 = this._teamResult[index].length > 0 ? this._teamResult[index] : getEmptyMemberStr(laneIndex);
            const team2 = this._teamResult[index + 5].length > 0 ? this._teamResult[index + 5] : getEmptyMemberStr(laneIndex);

            ctx.fillStyle = getFillStyle(this._teamResult[index]);
            ctx.strokeText(team1, startX - 35, posY);
            ctx.fillText(team1, startX - 35, posY);

            const laneText = getLaneText(laneIndex);
            ctx.fillStyle = getFillStyle(laneText);
            ctx.strokeText(laneText, startX, posY);
            ctx.fillText(laneText, startX, posY);

            ctx.fillStyle = getFillStyle(this._teamResult[index + 5]);
            ctx.strokeText(team2, startX + 35, posY);
            ctx.fillText(team2, startX + 35, posY);
        }
        ctx.restore();

    }

    getBoundingBox(): Rect | null {
        return null;
    }

    public setMeetBalance(bMeet: boolean) {
        this._meetBalance = bMeet;
    }

    public setLaneType(laneType: string) {
        if (laneType === 'fixed') {
            this._laneType = LaneType.FixedLane;
        } else if (laneType === 'random') {
            this._laneType = LaneType.Random;
        } else {
            this._laneType = LaneType.FromTop;
        }
    }

    public getExtraMarbles(): string[] {
        if (this._laneType === LaneType.Random) {
            return this.lanes.map(translateText);
        }
        return [];
    }

    public setFixedLanes(groups: number[]) {
        this._laneGroups = [];
        let index = 0;
        for (; index < groups.length; index++) {
            this._laneGroups.push(groups[index]);
        }
    }

    public updateTeamSetting() {
        this.setMeetBalance(getMeetBalance());

        const {nodes, areas} = getTeamSettingSnapshot();

        let members: string[] = [];
        let balances = new Map<number, string[]>();
        let sameTeams = new Map<number, string[]>();
        for (const node of nodes) {
            members.push(node.name);

            for (let index = 0; index < areas.length; index++) {
                if (nodeInside(node, areas[index])) {
                    if (areas[index].type === "Balance") {
                        if (!balances.has(index)) {
                            balances.set(index, [node.name]);
                        } else {
                            balances.get(index)?.push(node.name);
                        }
                        this._balanceMap.set(node.name, index);
                    } else if (areas[index].type === "SameTeam") {
                        if (!sameTeams.has(index)) {
                            sameTeams.set(index, [node.name]);
                        } else {
                            sameTeams.get(index)?.push(node.name);
                        }
                    }
                }
            }
        }

        this.calculatePossibleResults(members, balances, sameTeams);
    }

    public calculatePossibleResults(members: string[], balances: Map<number, string[]>, sameTeams: Map<number, string[]>) {
        // 빠른 탐색을 위한 이름 -> 레벨 맵핑
        this._balanceMap = new Map();
        balances.forEach((names, level) => {
            names.forEach((name) => this._balanceMap.set(name, level));
        });

        // 1. 10명 중 5명을 뽑는 모든 조합 구하기 (총 252가지)
        const getCombinations = <T>(arr: T[], k: number): T[][] => {
            const results: T[][] = [];
            const helper = (start: number, combo: T[]) => {
                if (combo.length === k) {
                    results.push([...combo]);
                    return;
                }
                for (let i = start; i < arr.length; i++) {
                    combo.push(arr[i]);
                    helper(i + 1, combo);
                    combo.pop();
                }
            };
            helper(0, []);
            return results;
        };

        const allT1Combos = getCombinations(members, 5);
        
        let minPenalty = Infinity;
        let optimalPartitions: { t1: string[]; t2: string[] }[] = [];

        // 2. 조합 필터링 및 밸런스 패널티가 가장 낮은 파티션 찾기
        for (const t1 of allT1Combos) {
            const t1Set = new Set(t1);
            const t2 = members.filter((m) => !t1Set.has(m));

            // Hard Constraint: 같은 팀 배정 조건 검사
            let validSame = true;
            for (const names of sameTeams.values()) {
                let inT1 = 0, inT2 = 0;
                for (const name of names) {
                    // members 배열 안에 존재하는 이름인 경우에만 카운트
                    if (t1Set.has(name)) inT1++;
                    else if (members.includes(name)) inT2++;
                }
                // 그룹이 1팀과 2팀으로 나뉘어버리면 무효 처리
                if (inT1 > 0 && inT2 > 0) {
                    validSame = false;
                    break;
                }
            }
            if (!validSame) continue;

            // Soft Constraint: 레벨 분포 밸런스 패널티 계산
            let penalty = 0;
            for (const names of balances.values()) {
                let count1 = 0, count2 = 0;
                for (const name of names) {
                    if (t1Set.has(name)) count1++;
                    else if (members.includes(name)) count2++;
                }
                penalty += Math.abs(count1 - count2);
            }

            // 최소 패널티 갱신 시 배열 초기화, 같으면 추가
            if (penalty < minPenalty) {
                minPenalty = penalty;
                optimalPartitions = [{ t1, t2 }];
            } else if (penalty === minPenalty) {
                optimalPartitions.push({ t1, t2 });
            }
        }

        // 3. 배열의 모든 순열(Permutations)을 구하는 헬퍼 함수
        const getPermutations = (arr: string[]): string[][] => {
            if (arr.length === 0) return [[]];
            const result: string[][] = [];
            for (let i = 0; i < arr.length; i++) {
                const current = arr[i];
                const remaining = arr.slice(0, i).concat(arr.slice(i + 1));
                for (const perm of getPermutations(remaining)) {
                    result.push([current, ...perm]);
                }
            }
            return result;
        };

        let maxMeetScore = -1;
        this._candidateResults = [];

        // 4. 최적의 파티션들에 대해 1번~5번 자리 배치를 모두 탐색 (meetBalance 평가)
        for (const part of optimalPartitions) {
            const t1Perms = getPermutations(part.t1);
            const t2Perms = getPermutations(part.t2);

            for (const p1 of t1Perms) {
                for (const p2 of t2Perms) {
                    let score = 0;
                    
                    // meetBalance가 true일 때만 같은 포지션의 레벨 일치 개수를 계산
                    if (this._meetBalance) {
                        for (let i = 0; i < 5; i++) {
                            if (this._balanceMap.get(p1[i]) === this._balanceMap.get(p2[i])) {
                                score++;
                            }
                        }
                    }

                    // 최대 점수와 일치하는 레이아웃만 수집
                    if (score > maxMeetScore) {
                        maxMeetScore = score;
                        this._candidateResults = [{ team1: p1, team2: p2}];
                    } else if (score === maxMeetScore) {
                        this._candidateResults.push({ team1: p1, team2: p2});
                    }
                }
            }
        }
    }

    public updateTeams(winners: Marble[], bIsFinished: boolean) {
        if (winners.length === 0) {
            this.resetTeamResult();
            return;
        }

        const winnernames = winners.map((winner: Marble) => winner.name);
        const winnerStr = winnernames.join(',');

        if (winnerStr === this._winners) {
            return;
        }
        const oldWinners = this._winners.split(',');
        const addedWinners = winners.filter((winner: Marble) => !oldWinners.includes(winner.name));
        this._winners = winnerStr;

        switch (this._laneType) {
            case LaneType.FromTop:
                this.updateTeamsFromTop(addedWinners);
                break;
            case LaneType.FixedLane:
                this.updateTeamsWithFixedLane(addedWinners);
                break;
            case LaneType.Random:
                this.updateTeamsInRandom(addedWinners);
                break;
            default:
                console.log('invalid lane type');
        }

        if (bIsFinished)
        {
            if (this._candidateResults.length > 0) {
                this._teamResult = new Array(10).fill('');
                for (let i = 0; i < 5; i++) {
                    if (winnernames.includes(this._candidateResults[0].team1[i])) {
                        this._teamResult[i] = this._candidateResults[0].team1[i];
                    }
                    if (winnernames.includes(this._candidateResults[0].team2[i])) {
                        this._teamResult[i + 5] = this._candidateResults[0].team2[i];
                    }
                }
            } else {
                console.log("no candidates: %s", winnerStr);
            }
        }
    }

    private resetTeamResult() {
        if (this._winners.length === 0) {
            return;
        }

        this._winners = '';
        this._teamResult = new Array(10).fill('');
        this._laneResult = [];
    }

    private updateTeamsFromTop(newMembers: Marble[]) {
        if (newMembers.length === 0) return;

        for (const newMember of newMembers) {
            let nextCand: TeamResult[] = [];
            let ni = Number.MAX_VALUE;
            for (const cand of this._candidateResults) {
                let ci = 10;
                let opn = "";
                for (let i = 0; i < 5; i++) {
                    if (cand.team1[i] === newMember.name) {
                        ci = i;
                        opn = this._teamResult[i + 5];
                        break;
                    } 
                    if (cand.team2[i] === newMember.name) {
                        ci = i + 5;
                        opn = this._teamResult[i];
                        break;
                    }
                }

                if (opn.length > 0 && this._meetBalance) {
                    const opBal = this._balanceMap.get(opn) ?? -1;
                    const nb = this._balanceMap.get(newMember.name) ?? -1;
                    if ((nb != -1 || opBal != -1) && nb != opBal) {
                        ci += 10;
                    }
                }

                if (ci < ni) {
                    nextCand = [cand];
                    ni = ci;
                } else if (ci == ni) {
                    nextCand.push(cand);
                }
            }
            this._candidateResults = nextCand;
            this._teamResult[ni % 10] = newMember.name;
        }
    }

    private updateTeamsWithFixedLane(newMembers: Marble[]) {
        // TODO
    }

    private updateTeamsInRandom(newMembers: Marble[]) {
        const laneTexts = this.lanes.map(translateText);
        this.updateTeamsFromTop(newMembers.filter((newMember: Marble) => {
            const laneIndex = laneTexts.indexOf(newMember.name);
            if (laneIndex >= 0) {
                this._laneResult.push(laneIndex);
                return false;
            }
            return true;
        }));
    }
}