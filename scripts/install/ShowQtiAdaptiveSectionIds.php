<?php

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
 * Copyright (c) 2017 (original work) Open Assessment Technologies SA;
 */

namespace oat\taoQtiTest\scripts\install;

use common_report_Report as Report;
use oat\generis\model\OntologyAwareTrait;
use oat\generis\model\WidgetRdf;
use oat\oatbox\extension\InstallAction;
use oat\taoQtiTest\models\cat\CatService;
use tao_helpers_form_elements_JsonObject as JsonObject;

/**
 * Class ShowQtiAdaptiveSectionIds
 *
 * Show the QTI CAT Adaptive Section IDs on the Graphical User Interface.
 *
 * @package oat\taoQtiTest\scripts\install
 */
class ShowQtiAdaptiveSectionIds extends InstallAction
{
    use OntologyAwareTrait;

    public function __invoke($params)
    {
        $adaptiveSectionIdsProperty = $this->getProperty(CatService::CAT_ADAPTIVE_IDS_PROPERTY);
        $widgetProperty = $this->getProperty(WidgetRdf::PROPERTY_WIDGET);
        $adaptiveSectionIdsProperty->editPropertyValues($widgetProperty, JsonObject::WIDGET_ID);

        return new Report(Report::TYPE_SUCCESS, 'QTI CAT Adaptive Section IDs are now visible in the GUI.');
    }
}
