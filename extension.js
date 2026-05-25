/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import GObject from 'gi://GObject';
import St from 'gi://St';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
// ------------------
import Clutter from 'gi://Clutter';

const Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, _('My Shiny Indicator'));

        this.add_child(new St.Icon({
            icon_name:      'timer-symbolic',
            style_class:    'system-status-icon',
        }));

        let item = new PopupMenu.PopupMenuItem(_('Show Timer'));  // on hover

        // Giving the signal to do another action.
        item.connect('activate', () => {
            Main.notify(_('Whatʼs up, folks?'));   // popup window
        });

        this.menu.addMenuItem(item);
    }
});

export default class IndicatorExampleExtension extends Extension {
    enable() {
        try {
            this._indicator = new Indicator();
            Main.panel.addToStatusArea(this.uuid, this._indicator);
            console.log("Activated ✅");
        } catch (e) {
            logError(e);
            // best-effort cleanup
            try {
                if (this._indicator) {
                    this._indicator.destroy();
                }
            } catch (err) {
                logError(err);
            }
            this._indicator = null;
        }
    }

    disable() {
        try {
            if (this._indicator) {
                this._indicator.destroy();
                this._indicator = null;
            }
            console.log("Deactivated ❌");
        } catch (e) {
            logError(e);
            // ensure we don't leave a dangling reference
            this._indicator = null;
        }
    }
}
