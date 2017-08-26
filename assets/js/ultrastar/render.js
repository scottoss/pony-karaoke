export class LyricRenderer {
    constructor(canvas, x, y, w, h) {
        this.canvas = canvas;
        this.context = this.canvas.getContext('2d');
        this.rect = {x, y, w, h};
        this.song = null;
        this.part = 0;
        this.activeColour = '#4287f4';
    }

    setSong(song, part) {
        this.song = song;
        this.part = part || 0;
    }

    setRect(x, y, w, h) {
        this.rect = {x, y, w, h};
    }

    render(time) {
        let beat = this.song.msToBeats(time);
        let ctx = this.context;
        ctx.save();
        ctx.clearRect(this.rect.x, this.rect.y, this.rect.w, this.rect.h);
        ctx.fillStyle = 'rgba(50, 50, 50, 0.4)';
        ctx.fillRect(this.rect.x, this.rect.y, this.rect.w, this.rect.h);
        ctx.font = `${this.rect.h * 0.95}px sans-serif`;
        ctx.strokeStyle = 'black';
        ctx.fillStyle = 'white';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 1.5;
        let line = this.song.getLine(time, this.part);
        if (!line) {
            return;
        }
        let lineText = line.notes.map((x) => x.text).join('');
        let totalWidth = ctx.measureText(lineText).width;
        let x = this.rect.x + (this.rect.w/2 - totalWidth/2);
        let y = this.rect.y + this.rect.h/2;
        if (window.chrome) {
            y -= (this.rect.h * 0.95) / 11;
        }
        for (let note of line.notes) {
            let active = (beat >= note.beat && beat < note.beat + note.length);
            if (active) {
                ctx.save();
                ctx.fillStyle = this.activeColour;
                ctx.strokeStyle = 'white';
            }
            if (note.type === 'F') {
                ctx.save();
                ctx.font = `italic ${ctx.font}`;
            }
            ctx.fillText(note.text, x, y);
            ctx.strokeText(note.text, x, y);
            x += ctx.measureText(note.text).width;
            if (note.type === 'F') {
                ctx.restore();
            }
            if (active) {
                ctx.restore();
            }
        }
        ctx.restore();
    }
}

export class NoteRenderer {
    constructor(canvas, x, y, w, h) {
        this.canvas = canvas;
        this.context = this.canvas.getContext('2d');
        this.rect = {x, y, w, h};
        this.song = null;
        this.part = 0;
        this.player = null;
    }

    setSong(song, part) {
        this.song = song;
        this.part = part || 0;
    }

    setRect(x, y, w, h) {
        this.rect = {x, y, w, h};
    }

    setPlayer(player) {
        this.player = player;
    }

    render(time) {
        let ctx = this.context;
        ctx.clearRect(this.rect.x, this.rect.y, this.rect.w, this.rect.h);
        ctx.save();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#333333';
        ctx.lineCap = 'butt';
        for (let i = 0; i < 10; ++i) {
            ctx.beginPath();
            let y = this.rect.y + (this.rect.h - (i * (this.rect.h / 10))) - this.rect.h / 20;
            ctx.moveTo(this.rect.x, y);
            ctx.lineTo(this.rect.x + this.rect.w, y);
            ctx.stroke();
        }
        ctx.restore();

        let line = this.song.getLine(time, this.part);
        if (!line) {
            return;
        }
        let startBeat = line.notes[0].beat;
        let endBeat = line.notes[line.notes.length - 1].beat + line.notes[line.notes.length - 1].length;
        if (startBeat === endBeat) {
            return;
        }

        ctx.save();
        let beatWidth = this.rect.w / (endBeat - startBeat);
        let lowest = line.notes.reduce((min, note) => note.pitch < min ? note.pitch : min, Infinity);
        ctx.lineWidth = this.rect.h / 12.5;
        ctx.lineCap = 'round';
        ctx.strokeStyle = this.player.colour;
        for (let note of line.notes) {
            if (note.type === 'F') {
                continue;
            }
            let line = (note.pitch - lowest + 4) % 20;
            let y = this.rect.y + (this.rect.h - (line * (this.rect.h / 20))) - this.rect.h / 20;

            ctx.beginPath();
            ctx.moveTo(this.rect.x + ctx.lineWidth/2 + beatWidth * (note.beat - startBeat), y);
            ctx.lineTo(this.rect.x - ctx.lineWidth/2 + beatWidth * (note.beat - startBeat + note.length), y);
            ctx.stroke();
        }
        this.context.restore();

        if (this.player) {
            ctx.save();
            ctx.lineWidth = 10;
            ctx.lineCap = 'butt';
            ctx.strokeStyle = 'black';
            for (let note of this.player.notesInRange(startBeat, endBeat)) {
                let beat = note.time;
                let actual = line.getNoteNearBeat(beat);
                let renderLine = (note.note - lowest + 4) % 20;
                let altLine = (note.note - lowest + 4 + 12) % 20;
                let actualLine = (actual.pitch - lowest + 4) % 20;
                while (renderLine < 0) renderLine += 20;
                while (altLine < 0) altLine += 20;
                if (Math.abs(altLine - actualLine) < Math.abs(renderLine - actualLine)) {
                    renderLine = altLine;
                }
                let y = this.rect.y + (this.rect.h - (renderLine * (this.rect.h / 20))) - this.rect.h / 20;

                ctx.beginPath();
                ctx.moveTo(this.rect.x + beatWidth * (beat - startBeat), y);
                ctx.lineTo(this.rect.x + beatWidth * (beat - startBeat + 1), y);
                ctx.stroke();
            }
            ctx.restore();
        }
    }
}

export class ScoreRenderer {
    constructor(canvas, x, y, w, h) {
        this.canvas = canvas;
        this.context = this.canvas.getContext('2d');
        this.rect = {x, y, w, h};
        this.player = null;
    }

    setRect(x, y, w, h) {
        this.rect = {x, y, w, h};
    }

    setPlayer(player) {
        this.player = player;
    }

    render() {
        let ctx = this.canvas.getContext('2d');
        ctx.save();
        ctx.font = `${this.rect.h/1}px sans-serif`;
        ctx.strokeStyle = 'white';
        ctx.fillStyle = this.player.colour;
        ctx.textBaseline = 'top';
        ctx.textAlign = 'right';
        let y = this.rect.y;
        if (window.chrome) {
            y -= this.rect.h / 11;
        }
        ctx.clearRect(this.rect.x, this.rect.y, this.rect.w, this.rect.h);
        let text = `${this.player.nick}: ${this.player.score}`;
        ctx.fillText(text, this.rect.x+this.rect.w, y, this.rect.w);
        ctx.strokeText(text, this.rect.x+this.rect.w, y, this.rect.w);
        ctx.restore();
    }
}

export class TitleRenderer {
    constructor(canvas, song) {
        this.canvas = canvas;
        this.song = song;
        this.context = this.canvas.getContext('2d');
        this.rect = {w: canvas.clientWidth, h: canvas.clientHeight};
    }

    render(opacity) {
        let ctx = this.context;
        ctx.clearRect(0, 0, this.rect.w, this.rect.h);
        ctx.save();
        ctx.globalAlpha = opacity || 1;
        ctx.fillStyle = 'rgba(30, 30, 30, 0.7)';
        ctx.fillRect(0, 0, this.rect.w, this.rect.h);
        ctx.strokeStyle = 'black';
        ctx.fillStyle = 'white';
        ctx.textBaseline = 'top';
        ctx.textAlign = 'center';
        ctx.font = `${this.rect.h/9}px sans-serif`;
        ctx.fillText(this.song.metadata.title, this.rect.w / 2, 0.2638888889 * this.rect.h, this.rect.w);
        ctx.font = `${this.rect.h*0.07638888889}px sans-serif`;
        ctx.fillText(this.song.metadata.artist, this.rect.w / 2, 0.4166666667 * this.rect.h, this.rect.w);
        ctx.font = `${this.rect.h/18}px sans-serif`;
        let y = 240;
        ctx.fillText(`Transcribed by ${this.song.metadata.creator}`, this.rect.w / 2, 0.61111 * this.rect.h, this.rect.w);
        if (this.song.metadata.comment && this.song.metadata.comment.indexOf('mylittlekaraoke') > -1) {
            ctx.fillText("Originally created for My Little Karaoke", this.rect.w / 2, 0.6944444444 * this.rect.h, this.rect.w);
        }
        ctx.restore();
    }
}