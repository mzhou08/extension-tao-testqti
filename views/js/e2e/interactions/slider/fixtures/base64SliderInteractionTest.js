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
 * QTI test package
 */

export default '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';


