var db = null;
var captured = null;
var highestZ = 0;
var highestId = 0;

const SQL_INSERT = "INSERT INTO MyStickys (id, note, timstamp, left, top, zindex) VALUES(?,?,?,?,?,?)";
const SQL_DELETE = "DELETE FROM MyStickys WHERE id = ?";
const SQL_UPDATE = "UPDATE MyStickys SET note = ?, timestamp = ?, left = ?, top = ?, zindex = ? WHERE id = ?";
const SQL_COUNT = "SELECT COUNT(*) FROM MyStickys";
const SQL_CREATE_TABLE = "CREATE TABLE MyStickys (id REAL UNIQUE, note TEXT, timestamp REAL, left TEXT, top TEXT, zindex REAL)";
const SQL_SELECT = "SELECT id, note, timestamp, left, top, zindex FROM MyStickys ORDER BY id DESC";

if (window.openDatabase) {
    db = openDatabase("Notes", "1.0", "Stickys", 10000000);

    if (!db) {
        alert("Failed to open database!");
    }
} else {
    alert("Failed to open database! Make sure your browser supports HTML5 web storage");
}

function Note() {

    var self = this;

    var note = document.createElement('div');
    note.className = 'note';
    note.addEventListener('mousedown', function (e) {
        return self.onMouseDown(e)
    }, false);

    note.addEventListener('click', function () {
        return self.onNoteClick()
    }, false);

    this.note = note;

    var close = document.createElement('div');
    close.className = 'closebutton';

    close.addEventListener('click', function (e) {
        return self.close(e)
    }, false)

    note.appendChild(close);

    var edit = document.createElement('div');
    edit.className = 'edit';
    edit.setAttribute('contenteditable', true);
    edit.addEventListener('keyup', function () {
        self.onKeyUp();
    }, false);
    note.appendChild(edit);
    this.editField = edit;

    var ts = document.createElement('div');
    ts.className = 'timestamp';

    ts.addEventListener('mousedownn', function (e) {
        return self.onMouseDown(e);
    }, false);
    note.appendChild(ts);
    this.lastModified = ts;

    document.body.appendChild(note);

    return this;
}

Note.prototype = {
    get id() {
        if (!("_id" in this)) {
            this._id = 0;
        }
        return this._id;
    },

    set id(x) {
        this._id = x;
    },

    get text() {
        return this.editField.innerHTML;
    },

    set text(text) {
        this.editField.innerHTML = text;
    },

    get timestamp() {
        if (!("_timestamp" in this)) {
            this._timestamp = 0;
        }
        return this._timestamp;
    },

    set timestamp(ts) {
        if (this.timestamp == ts) {
            return;
        }

        this._timestamp = ts;
        var date = new Date();
        date.setTime(parseFloat(ts));
        this.lastModified.textContent = modifiedString(date);
    },

    get left() {
        return this.note.style.left;
    },

    set left(left) {
        this.note.style.left = left;
    },

    get top() {
        return this.note.style.top;
    },

    set top(top) {
        this.note.style.top = top;
    },

    get zIndex() {
        return this.note.style.zIndex;
    },

    set zIndex(z) {
        this.note.style.zIndex = z;
    },

    close: function (e) {
        this.cancelPendingSave();
        var note = this;
        db.transaction(function (tx) {
            tx.executeSql(SQL_DELETE, [note.id]);
        });

        document.body.removeChild(this.note);
    },

    saveSoon: function () {
        this.cancelPendingSave();
        var self = this;
        this._saveTimer = setTimeout(function () {
            self.save()}, 200);
    },

    cancelPendingSave: function () {
        if (!("_saveTimer" in this)) {
            return;
        }

        clearTimeout(this._saveTimer);
        delete this._saveTimer;
    },

    // TODO: Need to debug
    save: function () {
        this.cancelPendingSave();
        if ("dirty" in this) {
            this.timestamp = new Date().getTime();
            delete this.dirty;
        }

        var note = this;
        db.transaction(function (tx) {
            tx.executeSql(SQL_UPDATE, [note.text, note.timestamp, note.left, note.top, note.zIndex, note.id]);
        });
    },

    // TODO: need to debug
    saveAsNew: function () {
        this.timestamp = new Date().getTime();

        var note = this;

        db.transaction(function (tx) {
            tx.executeSql(SQL_INSERT, [note.id, note.text, note.timestamp, note.left, note.top, note.zIndex]);
        })
    },

    onMouseDown: function (e) {
        captured = this;
        this.startX = e.clientX - this.note.offsetLeft;
        this.startY = e.clientY - this.note.offsetTop;
        this.zIndex = ++highestZ;

        var self = this;
        if (!("mouseMoveHandler" in this)) {
            this.mouseMoveHandler = function (e) {
                return self.onMouseMove(e);
            }

            this.mouseUpHandler = function (e) {
                return self.onMouseUp(e);
            }
        }

        document.addEventListener("mousemove", this.mouseMoveHandler, true);
        document.addEventListener("mouseup", this.mouseUpHandler, true);

        return false;
    },

    onMouseMove: function (e) {
        if (this != captured) {
            return true;
        }

        this.left = e.clientX - this.startX + "px";
        this.top = e.clientY - this.startY + "px";

        return false;
    },

    onMouseUp: function (e) {
        document.removeEventListener("mousemove", this.mouseMoveHandler, true);
        document.removeEventListener("mouseup", this.mouseUpHandler, true);

        this.save();
        return false;
    },

    onNoteClick: function (e) {
        this.editField.focus();
        getSelection().collapseToEnd();
    },

    onKeyUp: function (e) {
        this.dirty = true;
        this.saveSoon();
    }
}

function loaded(){
    db.transaction(function(tx) {
        tx.executeSql(SQL_COUNT, [], function(result) {
            loadNotes();
        }, function(tx, error) {
            tx.executeSql(SQL_CREATE_TABLE, [], function(result) { 
                loadNotes(); 
            });
        });
    });
}

function loadNotes() {
    db.transaction(function (tx) {
        tx.executeSql(SQL_SELECT, [], function (tx, result) {
            for (i = 0; i < result.rows.length; ++i) {
                var row = result.rows.item(i);
                var note = new Note();
                note.id = row['id'];
                note.text = row['note'];
                note.timestamp = row['timestamp'];
                note.left = row['left'];
                note.top = row['top'];
                note.zIndex = row['zindex'];

                if (row['id'] > highestId) {
                    highestId = row['id'];
                }

                if (row['zindex'] > highestZ) {
                    highestZ = row['zindex'];
                }
            }

            if (!result.rows.length) {
                newNote();
            }
        }, function (tx, error) {
            alert("Failed to get notes - " + error.message);
            return;
        });
    });
}

function modifiedString(date) {
    return "Sticky Last Modified: "
        + date.getFullYear()
        + "-"
        + (date.getMonth() + 1)
        + "-"
        + date.getDate()
        + " "
        + date.getHours()
        + ":"
        + date.getMinutes()
        + ":"
        + date.getSeconds();
}

function newNote() {
    var note = new Note();
    note.id = ++highestId;
    note.timestamp = new Date().getTime();
    note.left = Math.round(Math.random() * 400) + "px";
    note.top = Math.round(Math.random * 500) + "px";
    note.zIndex = highestZ + 1;
    note.saveAsNew();
}

if (db != null) {
    document.addEventListener("load", loaded(), false);
}