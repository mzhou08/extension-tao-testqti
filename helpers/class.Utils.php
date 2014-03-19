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
 * Copyright (c) 2014 (original work) Open Assessment Technologies SA (under the project TAO-PRODUCT);
 *
 */

/**
 * Miscellaneous utility methods for the QtiTest extension.
 * 
 * @author Jérôme Bogaerts <jerome@taotesting.com>
 *
 */
class taoQtiTest_helpers_Utils {
    
    /**
     * Store a file referenced by $qtiResource into the final $testContent folder. If the path provided
     * by $qtiResource contains sub-directories, they will be created before copying the file (even
     * if $copy = false).
     * 
     * @param core_kernel_file_File|string $testContent The pointer to the TAO Test Content folder.
     * @param taoQTI_models_classes_QTI_Resource|string $qtiTestResource The QTI resource to be copied into $testContent. If given as a string, it must be the relative (to the IMS QTI Package) path to the resource file.
     * @param string $origin The path to the directory (root folder of extracted IMS QTI package) containing the QTI resource to be copied.
     * @param boolean $copy If set to false, the file will not be actually copied.
     * @param string $rename A new filename  e.g. 'file.css' to be used at storage time.
     * @return string The path were the file was copied/has to be copied (depending on the $copy argument).
     * @throws InvalidArgumentException If one of the above arguments is invalid.
     * @throws common_Exception If the copy fails.
     */
    static public function storeQtiResource($testContent, $qtiResource, $origin, $copy = true, $rename = '') {
        if ($testContent instanceof core_kernel_file_File) {
            $contentPath = $testContent->getAbsolutePath();
        }
        else if (is_string($testContent) === true) {
            $contentPath = $testContent;
        }
        else {
            common_Logger::i(get_class($testContent));
            throw new InvalidArgumentException("The 'testContent' argument must be a string or a taoQTI_models_classes_QTI_Resource object.");
        }
        
        $ds = DIRECTORY_SEPARATOR;
        $contentPath = rtrim($contentPath, $ds);
        
        if ($qtiResource instanceof taoQTI_models_classes_QTI_Resource) {
            $filePath = $qtiResource->getFile();
        }
        else if (is_string($qtiResource) === true) {
            $filePath = $qtiResource;
        }
        else {
            throw new InvalidArgumentException("The 'qtiResource' argument must be a string or a taoQTI_models_classes_QTI_Resource object.");
        }
        
        $resourcePathinfo = pathinfo($filePath);
        
        if (empty($resourcePathinfo['dirname']) === false && $resourcePathinfo['dirname'] !== '.') {
            // The resource file is not at the root of the archive but in a sub-folder.
            // Let's copy it in the same way into the Test Content folder.
            $breadCrumb = $contentPath . $ds . str_replace('/', $ds, $resourcePathinfo['dirname']);
            $breadCrumb = rtrim($breadCrumb, $ds);
            $finalName = (empty($rename) === true) ? ($resourcePathinfo['filename'] . '.' . $resourcePathinfo['extension']) : $rename;
            $finalPath = $breadCrumb . $ds . $finalName;
            
            if (is_dir($breadCrumb) === false && @mkdir($breadCrumb, 0770, true) === false) {
                throw new common_Exception("An error occured while creating the '${breadCrumb}' sub-directory where the QTI resource had to be copied.");
            }
        }
        else {
            // The resource file is at the root of the archive.
            // Overwrite template test.xml (created by self::createContent() method above) file with the new one.
            $finalName = (empty($rename) === true) ? ($resourcePathinfo['filename'] . '.' . $resourcePathinfo['extension']) : $rename;
            $finalPath = $contentPath . $ds . $finalName;
        }
        
        if ($copy === true) {
            $origin = str_replace('/', $ds, $origin);
            $origin = rtrim($origin, $ds);
            $sourcePath = $origin . $ds . str_replace('/', $ds, $filePath);

            if (tao_helpers_File::copy($sourcePath, $finalPath) === false) {
                throw new common_Exception("An error occured while copying the QTI resource from '${sourcePath}' to '${finalPath}'.");
            }
        }
        
        return $finalPath;
    }
    
    /**
     * Get the expected absolute path to a given $qtiResource that is already stored in TAO.
     * 
     * @param core_kernel_file_File|string $testContent The pointer to the TAO Test Content folder.
     * @param taoQTI_models_classes_QTI_Resource|string $qtiTestResource The QTI resource to be copied into $testContent. If given as a string, it must be the relative (to the TAO Content Folder) path to the resource file.
     * @throws InvalidArgumentException If one of the above arguments is invalid.
     * @return string The absolute path to $qtiResource.
     */
    static public function storedQtiResourcePath($testContent, $qtiResource) {
        if ($testContent instanceof core_kernel_file_File) {
            $contentPath = $testContent->getAbsolutePath();
        }
        else if (is_string($testContent) === true) {
            $contentPath = $testContent;
        }
        else {
            throw new InvalidArgumentException("The 'testContent' argument must be a string or a taoQTI_models_classes_QTI_Resource object.");
        }
        
        if ($qtiResource instanceof taoQti_models_classes_QTI_Resource) {
            $filePath = $qtiResource->getFile();
        }
        else if (is_string($qtiResource) === true) {
            $filePath = $qtiResource;
        }
        else {
            throw new InvalidArgumentException("The 'qtiResource' argument must be a string or a taoQTI_models_classes_QTI_Resource object.");
        }
        
        $ds = DIRECTORY_SEPARATOR;
        $filePath = ltrim($filePath, '/');
        $contentPath = rtrim($contentPath, $ds);
        return $contentPath . $ds . str_replace('/', $ds, $filePath);
    }
    
    /**
     * Returns an empty IMS Manifest file as a DOMDocument, ready to be fill with
     * new information about IMS QTI Items and Tests.
     * 
     * @return DOMDocument
     */
    static public function emptyImsManifest() {
        $templateRenderer = new taoItems_models_classes_TemplateRenderer(ROOT_PATH . '/taoQTI/models/classes/QTI/templates/imsmanifest.tpl.php', array(
            'qtiItems' => array(),
            'manifestIdentifier' => 'QTI-TEST-MANIFEST-' . tao_helpers_Display::textCleaner(uniqid('tao', true), '-')
        ));
        	
        $manifest = new DOMDocument('1.0', TAO_DEFAULT_ENCODING);
        $manifest->loadXML($templateRenderer->render());
        return $manifest;
    }
}