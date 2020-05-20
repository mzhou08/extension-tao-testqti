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
 * QTI test package with:
 * - single hottext interaction
 */
export default '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';