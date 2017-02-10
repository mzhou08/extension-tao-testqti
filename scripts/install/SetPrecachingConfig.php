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
 * Copyright (c) 2017 (original work) Open Assessment Technologies SA ;
 */

/**
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */

namespace oat\taoQtiTest\scripts\install;


use oat\tao\model\ClientLibConfigRegistry;

/**
 * Install action that configure the precaching
 */
class SetPrecachingConfig extends \common_ext_action_InstallAction
{
    /**
     * @param $params
     */
    public function __invoke($params)
    {


        //set the allow flag to true
        $qtiTest = \common_ext_ExtensionsManager::singleton()->getExtensionById('taoQtiTest');
        $config = $qtiTest->getConfig('testRunner');
        $config = array_merge($config, [
            'allow-browse-next-item' => true
        ]);
        $qtiTest->setConfig('testRunner', $config);

        //change the proxy implementation
        ClientLibConfigRegistry::getRegistry()->register('taoQtiTest/runner/proxy/loader', [
            'providerName' => 'preCachingProxy',
            'module'       => 'taoQtiTest/runner/proxy/cache/proxy'
        ]);
        
        return new \common_report_Report(
            \common_report_Report::TYPE_SUCCESS,
            "YEAH"
        );
    }
}

