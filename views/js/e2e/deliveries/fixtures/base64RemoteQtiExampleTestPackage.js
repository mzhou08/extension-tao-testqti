/**
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Copyright (c) 2019 (original work) Open Assessment Technologies SA ;
 */

/**
 * QTI test package with one block interaction
 */
const base64Test = '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';

export default base64Test;