import GLib from 'gi://GLib';

// ─── CONFIG ──────────────────────────────────────────────────────────────────

// GLib.get_user_data_dir() is like os.path.expanduser("~/.local/share") in Python
const DATA_DIR  = GLib.build_filenamev([GLib.get_user_data_dir(), 'Progress_tracker/study-timer']);
const DATA_FILE = GLib.build_filenamev([DATA_DIR, 'sessions.json']);

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/**
 * This will makse sure the folder exits. 
 * It will create the folder and the file of they do not exit.
 * Like: os.makedirs(path, exist_ok=True) in Python.
 */

function _ensureDir(){
    /**
     * 0o755 in Python = 0755 in octal JS = 493 in decimal
     * 0o455 is  permission code  ---> It tells the operating system who is allowed to do what with a folder.
     * Like drwxr-xr-x  2  user  user  study-timer/  ham kabhi kabhi dekhte he 'ls -al' command se linux file system me.
     * Therfore rwxr-xr-x = 755
     * 7        5        5
       ↑        ↑        ↑
     owner    group     others
     (you) (your team) (everyone else)

     * r    ->  4
     * w    ->  2
     * x    ->  1
     * dr   ->  directory
     * wxr  ->  2+1+4 = 7
     */

    GLib.mkdir_with_parents(DATA_DIR, 0o755);
     

}

/**
 * Read the JSON file from disk.
 * Returns the parsed object, or a fresh empty one if the file doesn't exist yet.
 */
function _readData(){
    try{
        // GLib.file_get_contents returns [ok, bytes]
        const [ok, bytes] = GLib.file_get_contents(DATA_FILE);
        if (!ok) return { sessions: [ ]};

        // bytes is a unit 8 Array, we decode it to  string, then parse JSON
        const text = new TextDecoder().decode(bytes);
        return JSON.parse(text);

    }catch (e) {
        // FIle doesn;t exist yet, ot is corrupt  - start fresh
        console.warn(`[study-timer] Could not read data file: ${e.message}`);
        return { sessions: [] };
    }
}

/**
 * Write the data object back to disk as json.
 * 
 * Python equivalent:
 *   with open(DATA_FILE, 'w') as f: json.dump(data, f, indent=2)
 */
function _writeData(data){
    try {
        _ensureDir();
        const text = JSON.stringify(data, null, 2) // null, 2 = pretty-print with 2 spaces
        GLib.file_set_contents(DATA_FILE, text);
    } catch (e) {
        console.error(`[study-timer] Could not write data file: ${e.message}`);
    }
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

/**
 * Save a completed study session.
 * 
 * @param {number} startTime - Unix timestamp (seconds) when session started
 * @param {number} endTime   - Unix timestamp (seconds) when session ended
 * @param {string} label     - Optional tag like "Deep Work", "Reading"
 * @param {string} note      - Optional free-text note
 * 
 * Python equivalent:
 *   def save_session(start_time, end_time, label="", note=""):
 */
export function saveSession(startTime, endTime, label = '', note = '') {
    const data = _readData();
        let totalSeconds = endTime - startTime;
        let hours = Math.floor(totalSeconds / 3600);
        let minutes = Math.floor((totalSeconds % 3600) / 60);
        let seconds = totalSeconds % 60;

    // Build the session record — like building a dict in Python
    const session = {
        date: new Date(startTime * 1000).toISOString().slice(0, 10), // "2025-06-07"
        start_time: startTime,
        end_time: endTime,
        duration_seconds: endTime - startTime,  // totalSeconds
        duration_HH_MM_SS: `${hours}:${minutes}:${seconds}`,
        time_fields: {
            Hours: hours,
            Minutes: minutes,
            Seconds: seconds
        },
        label: label,
        note: note,
    };

    /**
        let totalSeconds = Math.floor(this._elapsedMs / 1000);
        let hours = Math.floor(totalSeconds / 3600);
        let minutes = Math.floor((totalSeconds % 3600) / 60);
        let seconds = totalSeconds % 60;
     */

    data.sessions.push(session);
    _writeData(data);
    
    console.log(`[study-timer] Session saved: ${session.duration_seconds}s on ${session.date}`);
}

/**
 * Get ALL sessions from disk.
 * Returns a list (array) of session objects.
 */
export function getAllSessions() {
    return _readData().sessions;
}

/**
 * Get sessions for a specific date string like "2025-06-07".
 * 
 * Python equivalent:
 *   [s for s in get_all_sessions() if s['date'] == date_str]
 */
export function getSessionsByDate(dateStr) {
    return getAllSessions().filter(s => s.date === dateStr);
}

/**
 * Get total study seconds for a specific date.
 * Useful for heatmap: "how many seconds did I study on this day?"
 */
export function getTotalSecondsForDate(dateStr) {
    const sessions = getSessionsByDate(dateStr);
    // Like: sum(s['duration_seconds'] for s in sessions)
    return sessions.reduce((total, s) => total + s.duration_seconds, 0);
}