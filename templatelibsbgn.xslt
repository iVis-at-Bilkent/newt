<?xml version="1.0" standalone="yes"?>
<axsl:stylesheet xmlns:axsl="http://www.w3.org/1999/XSL/Transform" xmlns:schold="http://www.ascc.net/xml/schematron" xmlns:iso="http://purl.oclc.org/dsdl/schematron" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:sbgn="http://sbgn.org/libsbgn/0.2" version="1.0"><!--Implementers: please note that overriding process-prolog or process-root is 
    the preferred method for meta-stylesheets to use where possible. -->
<axsl:param name="archiveDirParameter"/><axsl:param name="archiveNameParameter"/><axsl:param name="fileNameParameter"/><axsl:param name="fileDirParameter"/><axsl:variable name="document-uri"><axsl:value-of select="namespace-uri(/)"/></axsl:variable>

<!--PHASES-->


<!--PROLOG-->
<axsl:output xmlns:svrl="http://purl.oclc.org/dsdl/svrl" method="xml" omit-xml-declaration="no" standalone="yes" indent="yes"/>

<!--XSD TYPES FOR XSLT2-->


<!--KEYS AND FUNCTIONS-->


<!--DEFAULT RULES-->


<!--MODE: SCHEMATRON-SELECT-FULL-PATH-->
<!--This mode can be used to generate an ugly though full XPath for locators-->
<axsl:template match="*" mode="schematron-select-full-path"><axsl:apply-templates select="." mode="schematron-get-full-path"/></axsl:template>

<!--MODE: SCHEMATRON-FULL-PATH-->
<!--This mode can be used to generate an ugly though full XPath for locators-->
<axsl:template match="*" mode="schematron-get-full-path"><axsl:apply-templates select="parent::*" mode="schematron-get-full-path"/><axsl:text>/</axsl:text><axsl:choose><axsl:when test="namespace-uri()=''"><axsl:value-of select="name()"/><axsl:variable name="p_1" select="1+    count(preceding-sibling::*[name()=name(current())])"/><axsl:if test="$p_1&gt;1 or following-sibling::*[name()=name(current())]">[<axsl:value-of select="$p_1"/>]</axsl:if></axsl:when><axsl:otherwise><axsl:text>*[local-name()='</axsl:text><axsl:value-of select="local-name()"/><axsl:text>']</axsl:text><axsl:variable name="p_2" select="1+   count(preceding-sibling::*[local-name()=local-name(current())])"/><axsl:if test="$p_2&gt;1 or following-sibling::*[local-name()=local-name(current())]">[<axsl:value-of select="$p_2"/>]</axsl:if></axsl:otherwise></axsl:choose></axsl:template><axsl:template match="@*" mode="schematron-get-full-path"><axsl:text>/</axsl:text><axsl:choose><axsl:when test="namespace-uri()=''">@<axsl:value-of select="name()"/></axsl:when><axsl:otherwise><axsl:text>@*[local-name()='</axsl:text><axsl:value-of select="local-name()"/><axsl:text>' and namespace-uri()='</axsl:text><axsl:value-of select="namespace-uri()"/><axsl:text>']</axsl:text></axsl:otherwise></axsl:choose></axsl:template>

<!--MODE: SCHEMATRON-FULL-PATH-2-->
<!--This mode can be used to generate prefixed XPath for humans-->
<axsl:template match="node() | @*" mode="schematron-get-full-path-2"><axsl:for-each select="ancestor-or-self::*"><axsl:text>/</axsl:text><axsl:value-of select="name(.)"/><axsl:if test="preceding-sibling::*[name(.)=name(current())]"><axsl:text>[</axsl:text><axsl:value-of select="count(preceding-sibling::*[name(.)=name(current())])+1"/><axsl:text>]</axsl:text></axsl:if></axsl:for-each><axsl:if test="not(self::*)"><axsl:text/>/@<axsl:value-of select="name(.)"/></axsl:if></axsl:template><!--MODE: SCHEMATRON-FULL-PATH-3-->
<!--This mode can be used to generate prefixed XPath for humans 
	(Top-level element has index)-->
<axsl:template match="node() | @*" mode="schematron-get-full-path-3"><axsl:for-each select="ancestor-or-self::*"><axsl:text>/</axsl:text><axsl:value-of select="name(.)"/><axsl:if test="parent::*"><axsl:text>[</axsl:text><axsl:value-of select="count(preceding-sibling::*[name(.)=name(current())])+1"/><axsl:text>]</axsl:text></axsl:if></axsl:for-each><axsl:if test="not(self::*)"><axsl:text/>/@<axsl:value-of select="name(.)"/></axsl:if></axsl:template>

<!--MODE: GENERATE-ID-FROM-PATH -->
<axsl:template match="/" mode="generate-id-from-path"/><axsl:template match="text()" mode="generate-id-from-path"><axsl:apply-templates select="parent::*" mode="generate-id-from-path"/><axsl:value-of select="concat('.text-', 1+count(preceding-sibling::text()), '-')"/></axsl:template><axsl:template match="comment()" mode="generate-id-from-path"><axsl:apply-templates select="parent::*" mode="generate-id-from-path"/><axsl:value-of select="concat('.comment-', 1+count(preceding-sibling::comment()), '-')"/></axsl:template><axsl:template match="processing-instruction()" mode="generate-id-from-path"><axsl:apply-templates select="parent::*" mode="generate-id-from-path"/><axsl:value-of select="concat('.processing-instruction-', 1+count(preceding-sibling::processing-instruction()), '-')"/></axsl:template><axsl:template match="@*" mode="generate-id-from-path"><axsl:apply-templates select="parent::*" mode="generate-id-from-path"/><axsl:value-of select="concat('.@', name())"/></axsl:template><axsl:template match="*" mode="generate-id-from-path" priority="-0.5"><axsl:apply-templates select="parent::*" mode="generate-id-from-path"/><axsl:text>.</axsl:text><axsl:value-of select="concat('.',name(),'-',1+count(preceding-sibling::*[name()=name(current())]),'-')"/></axsl:template>

<!--MODE: GENERATE-ID-2 -->
<axsl:template match="/" mode="generate-id-2">U</axsl:template><axsl:template match="*" mode="generate-id-2" priority="2"><axsl:text>U</axsl:text><axsl:number level="multiple" count="*"/></axsl:template><axsl:template match="node()" mode="generate-id-2"><axsl:text>U.</axsl:text><axsl:number level="multiple" count="*"/><axsl:text>n</axsl:text><axsl:number count="node()"/></axsl:template><axsl:template match="@*" mode="generate-id-2"><axsl:text>U.</axsl:text><axsl:number level="multiple" count="*"/><axsl:text>_</axsl:text><axsl:value-of select="string-length(local-name(.))"/><axsl:text>_</axsl:text><axsl:value-of select="translate(name(),':','.')"/></axsl:template><!--Strip characters--><axsl:template match="text()" priority="-1"/>

<!--SCHEMA SETUP-->
<axsl:template match="/"><svrl:schematron-output xmlns:svrl="http://purl.oclc.org/dsdl/svrl" title="sbgn_validation" schemaVersion="0.1"><axsl:attribute name="phase">basic</axsl:attribute><axsl:comment><axsl:value-of select="$archiveDirParameter"/>   
		 <axsl:value-of select="$archiveNameParameter"/>  
		 <axsl:value-of select="$fileNameParameter"/>  
		 <axsl:value-of select="$fileDirParameter"/></axsl:comment><svrl:text>p test 1</svrl:text><svrl:ns-prefix-in-attribute-values uri="http://sbgn.org/libsbgn/0.2" prefix="sbgn"/><svrl:active-pattern><axsl:attribute name="document"><axsl:value-of select="namespace-uri(/)"/></axsl:attribute><axsl:attribute name="id">00001</axsl:attribute><axsl:attribute name="name">00001</axsl:attribute><axsl:apply-templates/></svrl:active-pattern><axsl:apply-templates select="/" mode="M6"/><svrl:active-pattern><axsl:attribute name="document"><axsl:value-of select="namespace-uri(/)"/></axsl:attribute><axsl:attribute name="id">00002</axsl:attribute><axsl:attribute name="name">00002</axsl:attribute><axsl:apply-templates/></svrl:active-pattern><axsl:apply-templates select="/" mode="M7"/><svrl:active-pattern><axsl:attribute name="document"><axsl:value-of select="namespace-uri(/)"/></axsl:attribute><axsl:attribute name="id">pd10101</axsl:attribute><axsl:attribute name="name">pd10101</axsl:attribute><axsl:apply-templates/></svrl:active-pattern><axsl:apply-templates select="/" mode="M8"/><svrl:active-pattern><axsl:attribute name="document"><axsl:value-of select="namespace-uri(/)"/></axsl:attribute><axsl:attribute name="id">pd10102</axsl:attribute><axsl:attribute name="name">pd10102</axsl:attribute><axsl:apply-templates/></svrl:active-pattern><axsl:apply-templates select="/" mode="M9"/><svrl:active-pattern><axsl:attribute name="document"><axsl:value-of select="namespace-uri(/)"/></axsl:attribute><axsl:attribute name="id">pd10103</axsl:attribute><axsl:attribute name="name">pd10103</axsl:attribute><axsl:apply-templates/></svrl:active-pattern><axsl:apply-templates select="/" mode="M10"/><svrl:active-pattern><axsl:attribute name="document"><axsl:value-of select="namespace-uri(/)"/></axsl:attribute><axsl:attribute name="id">pd10104</axsl:attribute><axsl:attribute name="name">pd10104</axsl:attribute><axsl:apply-templates/></svrl:active-pattern><axsl:apply-templates select="/" mode="M11"/><svrl:active-pattern><axsl:attribute name="document"><axsl:value-of select="namespace-uri(/)"/></axsl:attribute><axsl:attribute name="id">pd10105</axsl:attribute><axsl:attribute name="name">pd10105</axsl:attribute><axsl:apply-templates/></svrl:active-pattern><axsl:apply-templates select="/" mode="M12"/><svrl:active-pattern><axsl:attribute name="document"><axsl:value-of select="namespace-uri(/)"/></axsl:attribute><axsl:attribute name="id">pd10106</axsl:attribute><axsl:attribute name="name">pd10106</axsl:attribute><axsl:apply-templates/></svrl:active-pattern><axsl:apply-templates select="/" mode="M13"/><svrl:active-pattern><axsl:attribute name="document"><axsl:value-of select="namespace-uri(/)"/></axsl:attribute><axsl:attribute name="id">pd10107</axsl:attribute><axsl:attribute name="name">pd10107</axsl:attribute><axsl:apply-templates/></svrl:active-pattern><axsl:apply-templates select="/" mode="M14"/><svrl:active-pattern><axsl:attribute name="document"><axsl:value-of select="namespace-uri(/)"/></axsl:attribute><axsl:attribute name="id">pd10108</axsl:attribute><axsl:attribute name="name">pd10108</axsl:attribute><axsl:apply-templates/></svrl:active-pattern><axsl:apply-templates select="/" mode="M15"/><svrl:active-pattern><axsl:attribute name="document"><axsl:value-of select="namespace-uri(/)"/></axsl:attribute><axsl:attribute name="id">pd10109</axsl:attribute><axsl:attribute name="name">pd10109</axsl:attribute><axsl:apply-templates/></svrl:active-pattern><axsl:apply-templates select="/" mode="M16"/><svrl:active-pattern><axsl:attribute name="document"><axsl:value-of select="namespace-uri(/)"/></axsl:attribute><axsl:attribute name="id">pd10110</axsl:attribute><axsl:attribute name="name">pd10110</axsl:attribute><axsl:apply-templates/></svrl:active-pattern><axsl:apply-templates select="/" mode="M17"/><svrl:active-pattern><axsl:attribute name="document"><axsl:value-of select="namespace-uri(/)"/></axsl:attribute><axsl:attribute name="id">pd10111</axsl:attribute><axsl:attribute name="name">pd10111</axsl:attribute><axsl:apply-templates/></svrl:active-pattern><axsl:apply-templates select="/" mode="M18"/><svrl:active-pattern><axsl:attribute name="document"><axsl:value-of select="namespace-uri(/)"/></axsl:attribute><axsl:attribute name="id">pd10112</axsl:attribute><axsl:attribute name="name">pd10112</axsl:attribute><axsl:apply-templates/></svrl:active-pattern><axsl:apply-templates select="/" mode="M19"/><svrl:active-pattern><axsl:attribute name="document"><axsl:value-of select="namespace-uri(/)"/></axsl:attribute><axsl:attribute name="id">pd10124</axsl:attribute><axsl:attribute name="name">pd10124</axsl:attribute><axsl:apply-templates/></svrl:active-pattern><axsl:apply-templates select="/" mode="M20"/><svrl:active-pattern><axsl:attribute name="document"><axsl:value-of select="namespace-uri(/)"/></axsl:attribute><axsl:attribute name="id">pd10125</axsl:attribute><axsl:attribute name="name">pd10125</axsl:attribute><axsl:apply-templates/></svrl:active-pattern><axsl:apply-templates select="/" mode="M21"/><svrl:active-pattern><axsl:attribute name="document"><axsl:value-of select="namespace-uri(/)"/></axsl:attribute><axsl:attribute name="id">pd10126</axsl:attribute><axsl:attribute name="name">pd10126</axsl:attribute><axsl:apply-templates/></svrl:active-pattern><axsl:apply-templates select="/" mode="M22"/><svrl:active-pattern><axsl:attribute name="document"><axsl:value-of select="namespace-uri(/)"/></axsl:attribute><axsl:attribute name="id">pd10127</axsl:attribute><axsl:attribute name="name">pd10127</axsl:attribute><axsl:apply-templates/></svrl:active-pattern><axsl:apply-templates select="/" mode="M23"/><svrl:active-pattern><axsl:attribute name="document"><axsl:value-of select="namespace-uri(/)"/></axsl:attribute><axsl:attribute name="id">pd10128</axsl:attribute><axsl:attribute name="name">pd10128</axsl:attribute><axsl:apply-templates/></svrl:active-pattern><axsl:apply-templates select="/" mode="M24"/><svrl:active-pattern><axsl:attribute name="document"><axsl:value-of select="namespace-uri(/)"/></axsl:attribute><axsl:attribute name="id">pd10129</axsl:attribute><axsl:attribute name="name">pd10129</axsl:attribute><axsl:apply-templates/></svrl:active-pattern><axsl:apply-templates select="/" mode="M25"/><svrl:active-pattern><axsl:attribute name="document"><axsl:value-of select="namespace-uri(/)"/></axsl:attribute><axsl:attribute name="id">pd10130</axsl:attribute><axsl:attribute name="name">pd10130</axsl:attribute><axsl:apply-templates/></svrl:active-pattern><axsl:apply-templates select="/" mode="M26"/><svrl:active-pattern><axsl:attribute name="document"><axsl:value-of select="namespace-uri(/)"/></axsl:attribute><axsl:attribute name="id">pd10131</axsl:attribute><axsl:attribute name="name">pd10131</axsl:attribute><axsl:apply-templates/></svrl:active-pattern><axsl:apply-templates select="/" mode="M27"/><svrl:active-pattern><axsl:attribute name="document"><axsl:value-of select="namespace-uri(/)"/></axsl:attribute><axsl:attribute name="id">pd10132</axsl:attribute><axsl:attribute name="name">pd10132</axsl:attribute><axsl:apply-templates/></svrl:active-pattern><axsl:apply-templates select="/" mode="M28"/><svrl:active-pattern><axsl:attribute name="document"><axsl:value-of select="namespace-uri(/)"/></axsl:attribute><axsl:attribute name="id">pd10133</axsl:attribute><axsl:attribute name="name">pd10133</axsl:attribute><axsl:apply-templates/></svrl:active-pattern><axsl:apply-templates select="/" mode="M29"/><svrl:active-pattern><axsl:attribute name="document"><axsl:value-of select="namespace-uri(/)"/></axsl:attribute><axsl:attribute name="id">pd10134</axsl:attribute><axsl:attribute name="name">pd10134</axsl:attribute><axsl:apply-templates/></svrl:active-pattern><axsl:apply-templates select="/" mode="M30"/><svrl:active-pattern><axsl:attribute name="document"><axsl:value-of select="namespace-uri(/)"/></axsl:attribute><axsl:attribute name="id">pd10140</axsl:attribute><axsl:attribute name="name">pd10140</axsl:attribute><axsl:apply-templates/></svrl:active-pattern><axsl:apply-templates select="/" mode="M31"/><svrl:active-pattern><axsl:attribute name="document"><axsl:value-of select="namespace-uri(/)"/></axsl:attribute><axsl:attribute name="id">pd10141</axsl:attribute><axsl:attribute name="name">pd10141</axsl:attribute><axsl:apply-templates/></svrl:active-pattern><axsl:apply-templates select="/" mode="M32"/><svrl:active-pattern><axsl:attribute name="document"><axsl:value-of select="namespace-uri(/)"/></axsl:attribute><axsl:attribute name="id">pd10142</axsl:attribute><axsl:attribute name="name">pd10142</axsl:attribute><axsl:apply-templates/></svrl:active-pattern><axsl:apply-templates select="/" mode="M33"/></svrl:schematron-output></axsl:template>

<!--SCHEMATRON PATTERNS-->
<svrl:text xmlns:svrl="http://purl.oclc.org/dsdl/svrl">sbgn_validation</svrl:text>

<!--PATTERN 00001-->


	<!--RULE -->
<axsl:template match="//*[@id]" priority="1000" mode="M6"><svrl:fired-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl" context="//*[@id]"/><axsl:variable name="id" select="@id"/>

		<!--ASSERT error-->
<axsl:choose><axsl:when test="count(//@id[. = current()/@id]) = 1"/><axsl:otherwise><svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" test="count(//@id[. = current()/@id]) = 1"><axsl:attribute name="id">00001</axsl:attribute><axsl:attribute name="role">error</axsl:attribute><axsl:attribute name="location"><axsl:apply-templates select="." mode="schematron-select-full-path"/></axsl:attribute><svrl:text>ID needs to be unique.</svrl:text> <svrl:diagnostic-reference diagnostic="id">
<axsl:text/><axsl:value-of select="$id"/><axsl:text/></svrl:diagnostic-reference></svrl:failed-assert></axsl:otherwise></axsl:choose><axsl:apply-templates select="*" mode="M6"/></axsl:template><axsl:template match="text()" priority="-1" mode="M6"/><axsl:template match="@*|node()" priority="-2" mode="M6"><axsl:apply-templates select="*" mode="M6"/></axsl:template>

<!--PATTERN 00002-->


	<!--RULE -->
<axsl:template match="sbgn:arc" priority="1000" mode="M7"><svrl:fired-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl" context="sbgn:arc"/><axsl:variable name="target" select="@target"/>

		<!--ASSERT error-->
<axsl:choose><axsl:when test="//*/@id[. = $target]"/><axsl:otherwise><svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" test="//*/@id[. = $target]"><axsl:attribute name="id">00002</axsl:attribute><axsl:attribute name="role">error</axsl:attribute><axsl:attribute name="location"><axsl:apply-templates select="." mode="schematron-select-full-path"/></axsl:attribute><svrl:text>An arc target should be a glyph defined in the diagram.</svrl:text> <svrl:diagnostic-reference diagnostic="target">
<axsl:text/><axsl:value-of select="$target"/><axsl:text/></svrl:diagnostic-reference></svrl:failed-assert></axsl:otherwise></axsl:choose><axsl:apply-templates select="*" mode="M7"/></axsl:template><axsl:template match="text()" priority="-1" mode="M7"/><axsl:template match="@*|node()" priority="-2" mode="M7"><axsl:apply-templates select="*" mode="M7"/></axsl:template>

<!--PATTERN pd10101-->


	<!--RULE -->
<axsl:template match="sbgn:arc[@class='consumption']" priority="1000" mode="M8"><svrl:fired-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl" context="sbgn:arc[@class='consumption']"/><axsl:variable name="id" select="@id"/><axsl:variable name="source" select="@source"/><axsl:variable name="class" select="//sbgn:glyph[@id=$source]/@class"/>

		<!--ASSERT error-->
<axsl:choose><axsl:when test="     $class='macromolecule' or      $class='macromolecule multimer' or     $class='simple chemical' or     $class='unspecified entity' or      $class='complex multimer' or       $class='complex' or      $class='nucleic acid feature' or      $class='simple chemical multimer' or      $class='nucleic acid feature multimer' or      $class='source and sink'"/><axsl:otherwise><svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" test="$class='macromolecule' or $class='macromolecule multimer' or $class='simple chemical' or $class='unspecified entity' or $class='complex multimer' or $class='complex' or $class='nucleic acid feature' or $class='simple chemical multimer' or $class='nucleic acid feature multimer' or $class='source and sink'"><axsl:attribute name="id">pd10101</axsl:attribute><axsl:attribute name="role">error</axsl:attribute><axsl:attribute name="location"><axsl:apply-templates select="." mode="schematron-select-full-path"/></axsl:attribute><svrl:text>Arc with class consumption must have source reference to glyph of EPN classes
			</svrl:text> <svrl:diagnostic-reference diagnostic="id">
<axsl:text/><axsl:value-of select="$id"/><axsl:text/></svrl:diagnostic-reference> <svrl:diagnostic-reference diagnostic="source">
<axsl:text/><axsl:value-of select="$source"/><axsl:text/></svrl:diagnostic-reference> <svrl:diagnostic-reference diagnostic="class">
<axsl:text/><axsl:value-of select="$class"/><axsl:text/></svrl:diagnostic-reference></svrl:failed-assert></axsl:otherwise></axsl:choose><axsl:apply-templates select="*" mode="M8"/></axsl:template><axsl:template match="text()" priority="-1" mode="M8"/><axsl:template match="@*|node()" priority="-2" mode="M8"><axsl:apply-templates select="*" mode="M8"/></axsl:template>

<!--PATTERN pd10102-->


	<!--RULE -->
<axsl:template match="sbgn:arc[@class='consumption']" priority="1000" mode="M9"><svrl:fired-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl" context="sbgn:arc[@class='consumption']"/><axsl:variable name="id" select="@id"/><axsl:variable name="target" select="@target"/><axsl:variable name="port-class" select="//sbgn:port[@id=$target]/../@class"/>

		<!--ASSERT error-->
<axsl:choose><axsl:when test="     $port-class='process' or      $port-class='omitted process' or     $port-class='uncertain process' or     $port-class='association' or     $port-class='dissociation' or     $port-class='phenotype'"/><axsl:otherwise><svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" test="$port-class='process' or $port-class='omitted process' or $port-class='uncertain process' or $port-class='association' or $port-class='dissociation' or $port-class='phenotype'"><axsl:attribute name="id">pd10102</axsl:attribute><axsl:attribute name="role">error</axsl:attribute><axsl:attribute name="location"><axsl:apply-templates select="." mode="schematron-select-full-path"/></axsl:attribute><svrl:text>Arc with class consumption must have target reference to port on glyph with PN classes
			</svrl:text> <svrl:diagnostic-reference diagnostic="id">
<axsl:text/><axsl:value-of select="$id"/><axsl:text/></svrl:diagnostic-reference> <svrl:diagnostic-reference diagnostic="target">
<axsl:text/><axsl:value-of select="$target"/><axsl:text/></svrl:diagnostic-reference> <svrl:diagnostic-reference diagnostic="port-class">
<axsl:text/><axsl:value-of select="$port-class"/><axsl:text/></svrl:diagnostic-reference></svrl:failed-assert></axsl:otherwise></axsl:choose><axsl:apply-templates select="*" mode="M9"/></axsl:template><axsl:template match="text()" priority="-1" mode="M9"/><axsl:template match="@*|node()" priority="-2" mode="M9"><axsl:apply-templates select="*" mode="M9"/></axsl:template>

<!--PATTERN pd10103-->


	<!--RULE -->
<axsl:template match="sbgn:glyph[@class='source and sink']" priority="1000" mode="M10"><svrl:fired-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl" context="sbgn:glyph[@class='source and sink']"/><axsl:variable name="id" select="@id"/><axsl:variable name="count" select="count(//sbgn:arc[(./@class = 'consumption') and (./@source = $id)])"/>

		<!--ASSERT error-->
<axsl:choose><axsl:when test="$count &lt;= 1"/><axsl:otherwise><svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" test="$count &lt;= 1"><axsl:attribute name="id">pd10103</axsl:attribute><axsl:attribute name="role">error</axsl:attribute><axsl:attribute name="location"><axsl:apply-templates select="." mode="schematron-select-full-path"/></axsl:attribute><svrl:text>The 'source and sink' glyph can be connected to at most one consumption glyph. 
			</svrl:text> <svrl:diagnostic-reference diagnostic="id">
<axsl:text/><axsl:value-of select="$id"/><axsl:text/></svrl:diagnostic-reference> <svrl:diagnostic-reference diagnostic="count">
<axsl:text/><axsl:value-of select="$count"/><axsl:text/></svrl:diagnostic-reference></svrl:failed-assert></axsl:otherwise></axsl:choose><axsl:apply-templates select="*" mode="M10"/></axsl:template><axsl:template match="text()" priority="-1" mode="M10"/><axsl:template match="@*|node()" priority="-2" mode="M10"><axsl:apply-templates select="*" mode="M10"/></axsl:template>

<!--PATTERN pd10104-->


	<!--RULE -->
<axsl:template match="sbgn:glyph[@class='dissociation']" priority="1000" mode="M11"><svrl:fired-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl" context="sbgn:glyph[@class='dissociation']"/><axsl:variable name="id" select="@id"/><axsl:variable name="port-id" select="./sbgn:port/@id"/><axsl:variable name="count" select="count(//sbgn:arc[(./@class = 'consumption') and (./@target = current()/sbgn:port/@id)])"/>

		<!--ASSERT error-->
<axsl:choose><axsl:when test="$count = 1"/><axsl:otherwise><svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" test="$count = 1"><axsl:attribute name="id">pd10104</axsl:attribute><axsl:attribute name="role">error</axsl:attribute><axsl:attribute name="location"><axsl:apply-templates select="." mode="schematron-select-full-path"/></axsl:attribute><svrl:text>The 'dissociation' glyph can only be connected to one consumption glyph. 
			</svrl:text> <svrl:diagnostic-reference diagnostic="id">
<axsl:text/><axsl:value-of select="$id"/><axsl:text/></svrl:diagnostic-reference> <svrl:diagnostic-reference diagnostic="port-id">
<axsl:text/><axsl:value-of select="$port-id"/><axsl:text/></svrl:diagnostic-reference> <svrl:diagnostic-reference diagnostic="count">
<axsl:text/><axsl:value-of select="$count"/><axsl:text/></svrl:diagnostic-reference></svrl:failed-assert></axsl:otherwise></axsl:choose><axsl:apply-templates select="*" mode="M11"/></axsl:template><axsl:template match="text()" priority="-1" mode="M11"/><axsl:template match="@*|node()" priority="-2" mode="M11"><axsl:apply-templates select="*" mode="M11"/></axsl:template>

<!--PATTERN pd10105-->


	<!--RULE -->
<axsl:template match="sbgn:arc[@class='production']" priority="1000" mode="M12"><svrl:fired-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl" context="sbgn:arc[@class='production']"/><axsl:variable name="id" select="@id"/><axsl:variable name="source" select="@source"/><axsl:variable name="port-class" select="//sbgn:port[@id=$source]/../@class"/>

		<!--ASSERT error-->
<axsl:choose><axsl:when test="     $port-class='process' or      $port-class='omitted process' or     $port-class='uncertain process' or     $port-class='association' or     $port-class='dissociation' or     $port-class='phenotype'"/><axsl:otherwise><svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" test="$port-class='process' or $port-class='omitted process' or $port-class='uncertain process' or $port-class='association' or $port-class='dissociation' or $port-class='phenotype'"><axsl:attribute name="id">pd10105</axsl:attribute><axsl:attribute name="role">error</axsl:attribute><axsl:attribute name="location"><axsl:apply-templates select="." mode="schematron-select-full-path"/></axsl:attribute><svrl:text>Arc with class production must have source reference to port on glyph with PN classes and target reference to glyph of EPN classes
			</svrl:text> <svrl:diagnostic-reference diagnostic="id">
<axsl:text/><axsl:value-of select="$id"/><axsl:text/></svrl:diagnostic-reference> <svrl:diagnostic-reference diagnostic="source">
<axsl:text/><axsl:value-of select="$source"/><axsl:text/></svrl:diagnostic-reference> <svrl:diagnostic-reference diagnostic="port-class">
<axsl:text/><axsl:value-of select="$port-class"/><axsl:text/></svrl:diagnostic-reference></svrl:failed-assert></axsl:otherwise></axsl:choose><axsl:apply-templates select="*" mode="M12"/></axsl:template><axsl:template match="text()" priority="-1" mode="M12"/><axsl:template match="@*|node()" priority="-2" mode="M12"><axsl:apply-templates select="*" mode="M12"/></axsl:template>

<!--PATTERN pd10106-->


	<!--RULE -->
<axsl:template match="sbgn:arc[@class='production']" priority="1000" mode="M13"><svrl:fired-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl" context="sbgn:arc[@class='production']"/><axsl:variable name="id" select="@id"/><axsl:variable name="target" select="@target"/><axsl:variable name="class" select="//sbgn:glyph[@id=$target]/@class"/>

		<!--ASSERT error-->
<axsl:choose><axsl:when test="     $class='macromolecule' or      $class='macromolecule multimer' or      $class='simple chemical' or     $class='unspecified entity' or      $class='complex multimer' or          $class='complex' or      $class='nucleic acid feature' or      $class='simple chemical multimer' or      $class='nucleic acid feature multimer' or      $class='source and sink'"/><axsl:otherwise><svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" test="$class='macromolecule' or $class='macromolecule multimer' or $class='simple chemical' or $class='unspecified entity' or $class='complex multimer' or $class='complex' or $class='nucleic acid feature' or $class='simple chemical multimer' or $class='nucleic acid feature multimer' or $class='source and sink'"><axsl:attribute name="id">pd10106</axsl:attribute><axsl:attribute name="role">error</axsl:attribute><axsl:attribute name="location"><axsl:apply-templates select="." mode="schematron-select-full-path"/></axsl:attribute><svrl:text>Arc with class production must have target reference to glyph of EPN classes
			</svrl:text> <svrl:diagnostic-reference diagnostic="id">
<axsl:text/><axsl:value-of select="$id"/><axsl:text/></svrl:diagnostic-reference> <svrl:diagnostic-reference diagnostic="target">
<axsl:text/><axsl:value-of select="$target"/><axsl:text/></svrl:diagnostic-reference> <svrl:diagnostic-reference diagnostic="class">
<axsl:text/><axsl:value-of select="$class"/><axsl:text/></svrl:diagnostic-reference></svrl:failed-assert></axsl:otherwise></axsl:choose><axsl:apply-templates select="*" mode="M13"/></axsl:template><axsl:template match="text()" priority="-1" mode="M13"/><axsl:template match="@*|node()" priority="-2" mode="M13"><axsl:apply-templates select="*" mode="M13"/></axsl:template>

<!--PATTERN pd10107-->


	<!--RULE -->
<axsl:template match="sbgn:glyph[@class='source and sink']" priority="1000" mode="M14"><svrl:fired-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl" context="sbgn:glyph[@class='source and sink']"/><axsl:variable name="id" select="@id"/><axsl:variable name="count" select="count(//sbgn:arc[(./@class = 'production') and (./@target = $id)])"/>

		<!--ASSERT error-->
<axsl:choose><axsl:when test="$count &lt;= 1"/><axsl:otherwise><svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" test="$count &lt;= 1"><axsl:attribute name="id">pd10107</axsl:attribute><axsl:attribute name="role">error</axsl:attribute><axsl:attribute name="location"><axsl:apply-templates select="." mode="schematron-select-full-path"/></axsl:attribute><svrl:text>The 'source and sink' glyph can be connected to at most one production glyph. 
			</svrl:text> <svrl:diagnostic-reference diagnostic="id">
<axsl:text/><axsl:value-of select="$id"/><axsl:text/></svrl:diagnostic-reference> <svrl:diagnostic-reference diagnostic="count">
<axsl:text/><axsl:value-of select="$count"/><axsl:text/></svrl:diagnostic-reference></svrl:failed-assert></axsl:otherwise></axsl:choose><axsl:apply-templates select="*" mode="M14"/></axsl:template><axsl:template match="text()" priority="-1" mode="M14"/><axsl:template match="@*|node()" priority="-2" mode="M14"><axsl:apply-templates select="*" mode="M14"/></axsl:template>

<!--PATTERN pd10108-->


	<!--RULE -->
<axsl:template match="sbgn:glyph[@class='association']" priority="1000" mode="M15"><svrl:fired-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl" context="sbgn:glyph[@class='association']"/><axsl:variable name="id" select="@id"/><axsl:variable name="port-id" select="./sbgn:port/@id"/><axsl:variable name="count" select="count(//sbgn:arc[(./@class = 'production') and (./@source = current()/sbgn:port/@id)])"/>

		<!--ASSERT error-->
<axsl:choose><axsl:when test="$count = 1"/><axsl:otherwise><svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" test="$count = 1"><axsl:attribute name="id">pd10108</axsl:attribute><axsl:attribute name="role">error</axsl:attribute><axsl:attribute name="location"><axsl:apply-templates select="." mode="schematron-select-full-path"/></axsl:attribute><svrl:text>The association glyph can only be connected to one production glyph. 
			</svrl:text> <svrl:diagnostic-reference diagnostic="id">
<axsl:text/><axsl:value-of select="$id"/><axsl:text/></svrl:diagnostic-reference> <svrl:diagnostic-reference diagnostic="port-id">
<axsl:text/><axsl:value-of select="$port-id"/><axsl:text/></svrl:diagnostic-reference> <svrl:diagnostic-reference diagnostic="count">
<axsl:text/><axsl:value-of select="$count"/><axsl:text/></svrl:diagnostic-reference></svrl:failed-assert></axsl:otherwise></axsl:choose><axsl:apply-templates select="*" mode="M15"/></axsl:template><axsl:template match="text()" priority="-1" mode="M15"/><axsl:template match="@*|node()" priority="-2" mode="M15"><axsl:apply-templates select="*" mode="M15"/></axsl:template>

<!--PATTERN pd10109-->


	<!--RULE -->
<axsl:template match="sbgn:arc[(@class='modulation') or (@class='stimulation') or    (@class='catalysis') or (@class='inhibition') or (@class='necessary stimulation')]" priority="1000" mode="M16"><svrl:fired-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl" context="sbgn:arc[(@class='modulation') or (@class='stimulation') or    (@class='catalysis') or (@class='inhibition') or (@class='necessary stimulation')]"/><axsl:variable name="id" select="@id"/><axsl:variable name="source" select="@source"/><axsl:variable name="class" select="//sbgn:glyph[@id=$source]/@class"/><axsl:variable name="port-class" select="//sbgn:port[@id=$source]/../@class"/>

		<!--ASSERT error-->
<axsl:choose><axsl:when test="(     $class='unspecified entity' or      $class='simple chemical' or     $class='macromolecule' or      $class='macromolecule multimer' or     $class='nucleic acid feature' or      $class='simple chemical multimer' or      $class='nucleic acid feature multimer' or      $class='complex' or      $class='complex multimer' or          $class='perturbing agent') or (     $port-class='and' or      $port-class='or' or      $port-class='not')"/><axsl:otherwise><svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" test="( $class='unspecified entity' or $class='simple chemical' or $class='macromolecule' or $class='macromolecule multimer' or $class='nucleic acid feature' or $class='simple chemical multimer' or $class='nucleic acid feature multimer' or $class='complex' or $class='complex multimer' or $class='perturbing agent') or ( $port-class='and' or $port-class='or' or $port-class='not')"><axsl:attribute name="id">pd10109</axsl:attribute><axsl:attribute name="role">error</axsl:attribute><axsl:attribute name="location"><axsl:apply-templates select="." mode="schematron-select-full-path"/></axsl:attribute><svrl:text>Modulation arc must have source reference to glyph of EPN classes or a logical operator
			</svrl:text> <svrl:diagnostic-reference diagnostic="id">
<axsl:text/><axsl:value-of select="$id"/><axsl:text/></svrl:diagnostic-reference> <svrl:diagnostic-reference diagnostic="source">
<axsl:text/><axsl:value-of select="$source"/><axsl:text/></svrl:diagnostic-reference> <svrl:diagnostic-reference diagnostic="port-class">
<axsl:text/><axsl:value-of select="$port-class"/><axsl:text/></svrl:diagnostic-reference> <svrl:diagnostic-reference diagnostic="class">
<axsl:text/><axsl:value-of select="$class"/><axsl:text/></svrl:diagnostic-reference></svrl:failed-assert></axsl:otherwise></axsl:choose><axsl:apply-templates select="*" mode="M16"/></axsl:template><axsl:template match="text()" priority="-1" mode="M16"/><axsl:template match="@*|node()" priority="-2" mode="M16"><axsl:apply-templates select="*" mode="M16"/></axsl:template>

<!--PATTERN pd10110-->


	<!--RULE -->
<axsl:template match="sbgn:arc[(@class='modulation') or (@class='stimulation') or    (@class='catalysis') or (@class='inhibition') or (@class='necessary stimulation')]" priority="1000" mode="M17"><svrl:fired-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl" context="sbgn:arc[(@class='modulation') or (@class='stimulation') or    (@class='catalysis') or (@class='inhibition') or (@class='necessary stimulation')]"/><axsl:variable name="id" select="@id"/><axsl:variable name="target" select="@target"/><axsl:variable name="target-class" select="//sbgn:glyph[@id=$target]/@class"/>

		<!--ASSERT error-->
<axsl:choose><axsl:when test="     $target-class='process' or      $target-class='omitted process' or     $target-class='uncertain process' or     $target-class='association' or     $target-class='dissociation' or     $target-class='phenotype'"/><axsl:otherwise><svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" test="$target-class='process' or $target-class='omitted process' or $target-class='uncertain process' or $target-class='association' or $target-class='dissociation' or $target-class='phenotype'"><axsl:attribute name="id">pd10110</axsl:attribute><axsl:attribute name="role">error</axsl:attribute><axsl:attribute name="location"><axsl:apply-templates select="." mode="schematron-select-full-path"/></axsl:attribute><svrl:text>Modulation arc must have target reference to PN classes
			</svrl:text> <svrl:diagnostic-reference diagnostic="id">
<axsl:text/><axsl:value-of select="$id"/><axsl:text/></svrl:diagnostic-reference> <svrl:diagnostic-reference diagnostic="target">
<axsl:text/><axsl:value-of select="$target"/><axsl:text/></svrl:diagnostic-reference> <svrl:diagnostic-reference diagnostic="target-class">
<axsl:text/><axsl:value-of select="$target-class"/><axsl:text/></svrl:diagnostic-reference></svrl:failed-assert></axsl:otherwise></axsl:choose><axsl:apply-templates select="*" mode="M17"/></axsl:template><axsl:template match="text()" priority="-1" mode="M17"/><axsl:template match="@*|node()" priority="-2" mode="M17"><axsl:apply-templates select="*" mode="M17"/></axsl:template>

<!--PATTERN pd10111-->


	<!--RULE -->
<axsl:template match="sbgn:glyph[(@class='and') or (@class='or') or (@class='not')]" priority="1000" mode="M18"><svrl:fired-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl" context="sbgn:glyph[(@class='and') or (@class='or') or (@class='not')]"/><axsl:variable name="id" select="@id"/><axsl:variable name="port-id" select="./sbgn:port/@id"/><axsl:variable name="count" select="count(//sbgn:arc[./@source = current()/sbgn:port/@id])"/>

		<!--ASSERT error-->
<axsl:choose><axsl:when test="$count = 1"/><axsl:otherwise><svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" test="$count = 1"><axsl:attribute name="id">pd10111</axsl:attribute><axsl:attribute name="role">error</axsl:attribute><axsl:attribute name="location"><axsl:apply-templates select="." mode="schematron-select-full-path"/></axsl:attribute><svrl:text>'and', 'or', and 'not' glyphs must be the source for exactly one arc. 
			</svrl:text> <svrl:diagnostic-reference diagnostic="id">
<axsl:text/><axsl:value-of select="$id"/><axsl:text/></svrl:diagnostic-reference> <svrl:diagnostic-reference diagnostic="port-id">
<axsl:text/><axsl:value-of select="$port-id"/><axsl:text/></svrl:diagnostic-reference> <svrl:diagnostic-reference diagnostic="count">
<axsl:text/><axsl:value-of select="$count"/><axsl:text/></svrl:diagnostic-reference></svrl:failed-assert></axsl:otherwise></axsl:choose><axsl:apply-templates select="*" mode="M18"/></axsl:template><axsl:template match="text()" priority="-1" mode="M18"/><axsl:template match="@*|node()" priority="-2" mode="M18"><axsl:apply-templates select="*" mode="M18"/></axsl:template>

<!--PATTERN pd10112-->


	<!--RULE -->
<axsl:template match="sbgn:map/sbgn:glyph[(@class = 'unspecified entity' or      @class = 'simple chemical' or      @class = 'macromolecule' or      @class = 'nucleic acid feature' or     @class = 'simple chemical multimer' or      @class = 'macromolecule multimer' or      @class = 'nucleic acid feature multimer' or      @class = 'complex' or      @class = 'complex multimer' or      @class = 'source and sink' or     @class = 'perturbing agent')]" priority="1000" mode="M19"><svrl:fired-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl" context="sbgn:map/sbgn:glyph[(@class = 'unspecified entity' or      @class = 'simple chemical' or      @class = 'macromolecule' or      @class = 'nucleic acid feature' or     @class = 'simple chemical multimer' or      @class = 'macromolecule multimer' or      @class = 'nucleic acid feature multimer' or      @class = 'complex' or      @class = 'complex multimer' or      @class = 'source and sink' or     @class = 'perturbing agent')]"/><axsl:variable name="id" select="@id"/><axsl:variable name="compartment-count" select="count(//sbgn:glyph[@class='compartment'])"/>

		<!--ASSERT error-->
<axsl:choose><axsl:when test="     (($compartment-count = 0) and not (@compartmentRef)) or (($compartment-count &gt; 0) and @compartmentRef)"/><axsl:otherwise><svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" test="(($compartment-count = 0) and not (@compartmentRef)) or (($compartment-count &gt; 0) and @compartmentRef)"><axsl:attribute name="id">pd10112</axsl:attribute><axsl:attribute name="role">error</axsl:attribute><axsl:attribute name="location"><axsl:apply-templates select="." mode="schematron-select-full-path"/></axsl:attribute><svrl:text>If there are compartments defined, top-level glyphs must have a compartmentRef."
			</svrl:text> <svrl:diagnostic-reference diagnostic="id">
<axsl:text/><axsl:value-of select="$id"/><axsl:text/></svrl:diagnostic-reference></svrl:failed-assert></axsl:otherwise></axsl:choose><axsl:apply-templates select="*" mode="M19"/></axsl:template><axsl:template match="text()" priority="-1" mode="M19"/><axsl:template match="@*|node()" priority="-2" mode="M19"><axsl:apply-templates select="*" mode="M19"/></axsl:template>

<!--PATTERN pd10124-->


	<!--RULE -->
<axsl:template match="sbgn:arc[@class='logic arc']" priority="1000" mode="M20"><svrl:fired-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl" context="sbgn:arc[@class='logic arc']"/><axsl:variable name="id" select="@id"/><axsl:variable name="source" select="@source"/><axsl:variable name="class" select="//sbgn:glyph[@id=$source]/@class"/><axsl:variable name="port-class" select="//sbgn:port[@id=$source]/../@class"/>

		<!--ASSERT error-->
<axsl:choose><axsl:when test="     $class='unspecified entity' or      $class='simple chemical' or     $class='macromolecule' or      $class='macromolecule multimer' or     $class='nucleic acid feature' or      $class='simple chemical multimer' or      $class='nucleic acid feature multimer' or      $class='complex' or      $class='complex multimer' or     $port-class='and' or     $port-class='or' or     $port-class='not'"/><axsl:otherwise><svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" test="$class='unspecified entity' or $class='simple chemical' or $class='macromolecule' or $class='macromolecule multimer' or $class='nucleic acid feature' or $class='simple chemical multimer' or $class='nucleic acid feature multimer' or $class='complex' or $class='complex multimer' or $port-class='and' or $port-class='or' or $port-class='not'"><axsl:attribute name="id">pd10124</axsl:attribute><axsl:attribute name="role">error</axsl:attribute><axsl:attribute name="location"><axsl:apply-templates select="." mode="schematron-select-full-path"/></axsl:attribute><svrl:text>Arc with class logic arc must have source reference to glyph of EPN classes, or logic gates
			</svrl:text> <svrl:diagnostic-reference diagnostic="id">
<axsl:text/><axsl:value-of select="$id"/><axsl:text/></svrl:diagnostic-reference> <svrl:diagnostic-reference diagnostic="source">
<axsl:text/><axsl:value-of select="$source"/><axsl:text/></svrl:diagnostic-reference> <svrl:diagnostic-reference diagnostic="class">
<axsl:text/><axsl:value-of select="$class"/><axsl:text/></svrl:diagnostic-reference></svrl:failed-assert></axsl:otherwise></axsl:choose><axsl:apply-templates select="*" mode="M20"/></axsl:template><axsl:template match="text()" priority="-1" mode="M20"/><axsl:template match="@*|node()" priority="-2" mode="M20"><axsl:apply-templates select="*" mode="M20"/></axsl:template>

<!--PATTERN pd10125-->


	<!--RULE -->
<axsl:template match="sbgn:arc[@class='logic arc']" priority="1000" mode="M21"><svrl:fired-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl" context="sbgn:arc[@class='logic arc']"/><axsl:variable name="id" select="@id"/><axsl:variable name="target" select="@target"/><axsl:variable name="port-class" select="//sbgn:port[@id=$target]/../@class"/>

		<!--ASSERT error-->
<axsl:choose><axsl:when test="$port-class='and' or     $port-class='or' or     $port-class='not'"/><axsl:otherwise><svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" test="$port-class='and' or $port-class='or' or $port-class='not'"><axsl:attribute name="id">pd10125</axsl:attribute><axsl:attribute name="role">error</axsl:attribute><axsl:attribute name="location"><axsl:apply-templates select="." mode="schematron-select-full-path"/></axsl:attribute><svrl:text>Arc with class logic arc must have target reference to  a logical operator
			</svrl:text> <svrl:diagnostic-reference diagnostic="id">
<axsl:text/><axsl:value-of select="$id"/><axsl:text/></svrl:diagnostic-reference> <svrl:diagnostic-reference diagnostic="target">
<axsl:text/><axsl:value-of select="$target"/><axsl:text/></svrl:diagnostic-reference> <svrl:diagnostic-reference diagnostic="port-class">
<axsl:text/><axsl:value-of select="$port-class"/><axsl:text/></svrl:diagnostic-reference></svrl:failed-assert></axsl:otherwise></axsl:choose><axsl:apply-templates select="*" mode="M21"/></axsl:template><axsl:template match="text()" priority="-1" mode="M21"/><axsl:template match="@*|node()" priority="-2" mode="M21"><axsl:apply-templates select="*" mode="M21"/></axsl:template>

<!--PATTERN pd10126-->


	<!--RULE -->
<axsl:template match="sbgn:glyph[@class='not']" priority="1000" mode="M22"><svrl:fired-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl" context="sbgn:glyph[@class='not']"/><axsl:variable name="id" select="@id"/><axsl:variable name="port-id" select="./sbgn:port/@id"/><axsl:variable name="count" select="count(//sbgn:arc[(./@class = 'logic arc') and (./@target = current()/sbgn:port/@id)])"/>

		<!--ASSERT error-->
<axsl:choose><axsl:when test="$count = 1"/><axsl:otherwise><svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" test="$count = 1"><axsl:attribute name="id">pd10126</axsl:attribute><axsl:attribute name="role">error</axsl:attribute><axsl:attribute name="location"><axsl:apply-templates select="." mode="schematron-select-full-path"/></axsl:attribute><svrl:text>The 'not' glyph can only be the target of one logic arc glyph. 
			</svrl:text> <svrl:diagnostic-reference diagnostic="id">
<axsl:text/><axsl:value-of select="$id"/><axsl:text/></svrl:diagnostic-reference> <svrl:diagnostic-reference diagnostic="port-id">
<axsl:text/><axsl:value-of select="$port-id"/><axsl:text/></svrl:diagnostic-reference> <svrl:diagnostic-reference diagnostic="count">
<axsl:text/><axsl:value-of select="$count"/><axsl:text/></svrl:diagnostic-reference></svrl:failed-assert></axsl:otherwise></axsl:choose><axsl:apply-templates select="*" mode="M22"/></axsl:template><axsl:template match="text()" priority="-1" mode="M22"/><axsl:template match="@*|node()" priority="-2" mode="M22"><axsl:apply-templates select="*" mode="M22"/></axsl:template>

<!--PATTERN pd10127-->


	<!--RULE -->
<axsl:template match="sbgn:arc[@class='equivalence arc']" priority="1000" mode="M23"><svrl:fired-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl" context="sbgn:arc[@class='equivalence arc']"/><axsl:variable name="id" select="@id"/><axsl:variable name="source" select="@source"/><axsl:variable name="class" select="//sbgn:glyph[@id=$source]/@class"/>

		<!--ASSERT error-->
<axsl:choose><axsl:when test="     $class='unspecified entity' or      $class='simple chemical' or     $class='macromolecule' or      $class='macromolecule multimer' or     $class='nucleic acid feature' or      $class='simple chemical multimer' or      $class='nucleic acid feature multimer' or      $class='complex' or      $class='complex multimer' or          $class='source and sink' or      $class='perturbing agent'"/><axsl:otherwise><svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" test="$class='unspecified entity' or $class='simple chemical' or $class='macromolecule' or $class='macromolecule multimer' or $class='nucleic acid feature' or $class='simple chemical multimer' or $class='nucleic acid feature multimer' or $class='complex' or $class='complex multimer' or $class='source and sink' or $class='perturbing agent'"><axsl:attribute name="id">pd10127</axsl:attribute><axsl:attribute name="role">error</axsl:attribute><axsl:attribute name="location"><axsl:apply-templates select="." mode="schematron-select-full-path"/></axsl:attribute><svrl:text>Arc with class equivalence arc must have source reference to glyph of EPN classes
			</svrl:text> <svrl:diagnostic-reference diagnostic="id">
<axsl:text/><axsl:value-of select="$id"/><axsl:text/></svrl:diagnostic-reference> <svrl:diagnostic-reference diagnostic="source">
<axsl:text/><axsl:value-of select="$source"/><axsl:text/></svrl:diagnostic-reference> <svrl:diagnostic-reference diagnostic="class">
<axsl:text/><axsl:value-of select="$class"/><axsl:text/></svrl:diagnostic-reference></svrl:failed-assert></axsl:otherwise></axsl:choose><axsl:apply-templates select="*" mode="M23"/></axsl:template><axsl:template match="text()" priority="-1" mode="M23"/><axsl:template match="@*|node()" priority="-2" mode="M23"><axsl:apply-templates select="*" mode="M23"/></axsl:template>

<!--PATTERN pd10128-->


	<!--RULE -->
<axsl:template match="sbgn:arc[@class='equivalence arc']" priority="1000" mode="M24"><svrl:fired-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl" context="sbgn:arc[@class='equivalence arc']"/><axsl:variable name="id" select="@id"/><axsl:variable name="target" select="@target"/><axsl:variable name="class" select="//sbgn:glyph[@id=$target]/@class"/>

		<!--ASSERT error-->
<axsl:choose><axsl:when test="     $class='tag' or     $class='submap' or     $class='terminal'"/><axsl:otherwise><svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" test="$class='tag' or $class='submap' or $class='terminal'"><axsl:attribute name="id">pd10128</axsl:attribute><axsl:attribute name="role">error</axsl:attribute><axsl:attribute name="location"><axsl:apply-templates select="." mode="schematron-select-full-path"/></axsl:attribute><svrl:text>Arc with class equivalence arc must have target reference to glyph of classes 'tag', 'submap' or 'terminal'
			</svrl:text> <svrl:diagnostic-reference diagnostic="id">
<axsl:text/><axsl:value-of select="$id"/><axsl:text/></svrl:diagnostic-reference> <svrl:diagnostic-reference diagnostic="target">
<axsl:text/><axsl:value-of select="$target"/><axsl:text/></svrl:diagnostic-reference> <svrl:diagnostic-reference diagnostic="class">
<axsl:text/><axsl:value-of select="$class"/><axsl:text/></svrl:diagnostic-reference></svrl:failed-assert></axsl:otherwise></axsl:choose><axsl:apply-templates select="*" mode="M24"/></axsl:template><axsl:template match="text()" priority="-1" mode="M24"/><axsl:template match="@*|node()" priority="-2" mode="M24"><axsl:apply-templates select="*" mode="M24"/></axsl:template>

<!--PATTERN pd10129-->


	<!--RULE -->
<axsl:template match="sbgn:glyph[@class='and']/sbgn:port/sbgn:state" priority="1000" mode="M25"><svrl:fired-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl" context="sbgn:glyph[@class='and']/sbgn:port/sbgn:state"/><axsl:variable name="id" select="@id"/>

		<!--ASSERT error-->
<axsl:choose><axsl:when test="count(../../sbgn:port/sbgn:state[@variable = current()/@variable]) &lt;= 2"/><axsl:otherwise><svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" test="count(../../sbgn:port/sbgn:state[@variable = current()/@variable]) &lt;= 2"><axsl:attribute name="id">pd10129</axsl:attribute><axsl:attribute name="role">error</axsl:attribute><axsl:attribute name="location"><axsl:apply-templates select="." mode="schematron-select-full-path"/></axsl:attribute><svrl:text>All state variables associated with a Stateful Entity Pool Node should be unique and note duplicated within that node. 
			</svrl:text> <svrl:diagnostic-reference diagnostic="id">
<axsl:text/><axsl:value-of select="$id"/><axsl:text/></svrl:diagnostic-reference></svrl:failed-assert></axsl:otherwise></axsl:choose><axsl:apply-templates select="*" mode="M25"/></axsl:template><axsl:template match="text()" priority="-1" mode="M25"/><axsl:template match="@*|node()" priority="-2" mode="M25"><axsl:apply-templates select="*" mode="M25"/></axsl:template>

<!--PATTERN pd10130-->


	<!--RULE -->
<axsl:template match="sbgn:arc[@source = //sbgn:glyph[@class='complex']/sbgn:glyph/@id]" priority="1000" mode="M26"><svrl:fired-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl" context="sbgn:arc[@source = //sbgn:glyph[@class='complex']/sbgn:glyph/@id]"/><axsl:variable name="id" select="//sbgn:glyph[@class='complex']/sbgn:glyph[not(@class='complex')]/@id"/><axsl:variable name="class" select="@class"/>

		<!--ASSERT error-->
<axsl:choose><axsl:when test="@class = 'modulation'"/><axsl:otherwise><svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" test="@class = 'modulation'"><axsl:attribute name="id">pd10130</axsl:attribute><axsl:attribute name="role">error</axsl:attribute><axsl:attribute name="location"><axsl:apply-templates select="." mode="schematron-select-full-path"/></axsl:attribute><svrl:text>[NOT SURE]
			</svrl:text> <svrl:diagnostic-reference diagnostic="id">
<axsl:text/><axsl:value-of select="$id"/><axsl:text/></svrl:diagnostic-reference> <svrl:diagnostic-reference diagnostic="class">
<axsl:text/><axsl:value-of select="$class"/><axsl:text/></svrl:diagnostic-reference></svrl:failed-assert></axsl:otherwise></axsl:choose><axsl:apply-templates select="*" mode="M26"/></axsl:template><axsl:template match="text()" priority="-1" mode="M26"/><axsl:template match="@*|node()" priority="-2" mode="M26"><axsl:apply-templates select="*" mode="M26"/></axsl:template>

<!--PATTERN pd10131-->


	<!--RULE -->
<axsl:template match="/sbgn:sbgn/sbgn:map/sbgn:glyph[     @class = 'unspecified entity' or      @class = 'simple chemical' or      @class = 'macromolecule' or      @class = 'nucleic acid feature' or     @class = 'simple chemical multimer' or      @class = 'macromolecule multimer' or      @class = 'nucleic acid feature multimer' or      @class = 'complex' or      @class = 'complex multimer' or      @class = 'source and sink' or     @class = 'perturbing agent']    " priority="1000" mode="M27"><svrl:fired-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl" context="/sbgn:sbgn/sbgn:map/sbgn:glyph[     @class = 'unspecified entity' or      @class = 'simple chemical' or      @class = 'macromolecule' or      @class = 'nucleic acid feature' or     @class = 'simple chemical multimer' or      @class = 'macromolecule multimer' or      @class = 'nucleic acid feature multimer' or      @class = 'complex' or      @class = 'complex multimer' or      @class = 'source and sink' or     @class = 'perturbing agent']    "/><axsl:variable name="id" select="@id"/><axsl:variable name="class" select="//sbgn:arc[@source = $id or @target = $id]/@class"/>

		<!--ASSERT error-->
<axsl:choose><axsl:when test="//sbgn:arc[(      @class = 'production' or      @class = 'consumption' or            @class = 'modulation' or       @class = 'stimulation' or       @class = 'catalysis' or       @class = 'inhibition' or       @class = 'necessary stimulation' or       @class = 'logic arc' or       @class = 'equivalence arc' or       @class = 'production') and (@source = $id or @target = $id)]"/><axsl:otherwise><svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" test="//sbgn:arc[( @class = 'production' or @class = 'consumption' or @class = 'modulation' or @class = 'stimulation' or @class = 'catalysis' or @class = 'inhibition' or @class = 'necessary stimulation' or @class = 'logic arc' or @class = 'equivalence arc' or @class = 'production') and (@source = $id or @target = $id)]"><axsl:attribute name="id">pd10131</axsl:attribute><axsl:attribute name="role">error</axsl:attribute><axsl:attribute name="location"><axsl:apply-templates select="." mode="schematron-select-full-path"/></axsl:attribute><svrl:text>EPNs should not be orphaned (i.e. they must be associated with at least one arc.)
			</svrl:text> <svrl:diagnostic-reference diagnostic="id">
<axsl:text/><axsl:value-of select="$id"/><axsl:text/></svrl:diagnostic-reference> <svrl:diagnostic-reference diagnostic="class">
<axsl:text/><axsl:value-of select="$class"/><axsl:text/></svrl:diagnostic-reference></svrl:failed-assert></axsl:otherwise></axsl:choose><axsl:apply-templates select="*" mode="M27"/></axsl:template><axsl:template match="text()" priority="-1" mode="M27"/><axsl:template match="@*|node()" priority="-2" mode="M27"><axsl:apply-templates select="*" mode="M27"/></axsl:template>

<!--PATTERN pd10132-->


	<!--RULE -->
<axsl:template match="sbgn:glyph[       @class='process' or     @class='omitted process' or    @class='uncertain process' or    @class='association' or    @class='dissociation'   ]" priority="1000" mode="M28"><svrl:fired-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl" context="sbgn:glyph[       @class='process' or     @class='omitted process' or    @class='uncertain process' or    @class='association' or    @class='dissociation'   ]"/><axsl:variable name="id" select="@id"/><axsl:variable name="port-count" select="count(sbgn:port)"/>

		<!--ASSERT error-->
<axsl:choose><axsl:when test="$port-count = 2"/><axsl:otherwise><svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" test="$port-count = 2"><axsl:attribute name="id">pd10132</axsl:attribute><axsl:attribute name="role">error</axsl:attribute><axsl:attribute name="location"><axsl:apply-templates select="." mode="schematron-select-full-path"/></axsl:attribute><svrl:text>All process nodes (with the exception of phenotype) must have a LHS and RHS.
			</svrl:text> <svrl:diagnostic-reference diagnostic="id">
<axsl:text/><axsl:value-of select="$id"/><axsl:text/></svrl:diagnostic-reference></svrl:failed-assert></axsl:otherwise></axsl:choose><axsl:apply-templates select="*" mode="M28"/></axsl:template><axsl:template match="text()" priority="-1" mode="M28"/><axsl:template match="@*|node()" priority="-2" mode="M28"><axsl:apply-templates select="*" mode="M28"/></axsl:template>

<!--PATTERN pd10133-->


	<!--RULE -->
<!--
<axsl:template match="sbgn:glyph[       @class='process' or     @class='omitted process' or    @class='uncertain process' or    @class='association' or    @class='dissociation'   ]" priority="1000" mode="M29"><svrl:fired-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl" context="sbgn:glyph[       @class='process' or     @class='omitted process' or    @class='uncertain process' or    @class='association' or    @class='dissociation'   ]"/><axsl:variable name="id" select="@id"/><axsl:variable name="port-id-1" select="./sbgn:port[position() = 1]/@id"/><axsl:variable name="port-id-2" select="./sbgn:port[position() = 2]/@id"/><axsl:variable name="arc-count-1" select="count(//sbgn:arc[@source = $port-id-1])"/><axsl:variable name="arc-count-distinct-1" select="count(distinct-values(//sbgn:arc[@source = $port-id-1]/@target))"/><axsl:variable name="arc-count-2" select="count(//sbgn:arc[@source = $port-id-2])"/><axsl:variable name="arc-count-distinct-2" select="count(distinct-values(//sbgn:arc[@source = $port-id-2]/@target))"/> -->
<axsl:template match="sbgn:glyph[       @class='process' or     @class='omitted process' or    @class='uncertain process' or    @class='association' or    @class='dissociation'   ]" priority="1000" mode="M29"><svrl:fired-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl" context="sbgn:glyph[       @class='process' or     @class='omitted process' or    @class='uncertain process' or    @class='association' or    @class='dissociation'   ]"/><axsl:variable name="id" select="@id"/><axsl:variable name="port-id-1" select="./sbgn:port[position() = 1]/@id"/><axsl:variable name="port-id-2" select="./sbgn:port[position() = 2]/@id"/><axsl:variable name="arc-count-1" select="count(//sbgn:arc[@source = $port-id-1])"/><axsl:variable name="arc-count-distinct-1" select="count(//sbgn:arc[@source = $port-id-1]/@target[not(preceding::sbgn:arc[@source = $port-id-1]/@target/. = .)])"/><axsl:variable name="arc-count-2" select="count(//sbgn:arc[@source = $port-id-2])"/><axsl:variable name="arc-count-distinct-2" select="count(//sbgn:arc[@source = $port-id-2]/@target[not(preceding::sbgn:arc[@source = $port-id-2]/@target/. = .)])"/>
		<!--ASSERT error-->
<axsl:choose><axsl:when test="($arc-count-2 = $arc-count-distinct-2) and ($arc-count-1 = $arc-count-distinct-1)"/><axsl:otherwise><svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" test="($arc-count-2 = $arc-count-distinct-2) and ($arc-count-1 = $arc-count-distinct-1)"><axsl:attribute name="id">pd10133</axsl:attribute><axsl:attribute name="role">error</axsl:attribute><axsl:attribute name="location"><axsl:apply-templates select="." mode="schematron-select-full-path"/></axsl:attribute><svrl:text>All EPNs on the LHS of a process must be unique. 
			</svrl:text> <svrl:diagnostic-reference diagnostic="id">
<axsl:text/><axsl:value-of select="$id"/><axsl:text/></svrl:diagnostic-reference></svrl:failed-assert></axsl:otherwise></axsl:choose><axsl:apply-templates select="*" mode="M29"/></axsl:template><axsl:template match="text()" priority="-1" mode="M29"/><axsl:template match="@*|node()" priority="-2" mode="M29"><axsl:apply-templates select="*" mode="M29"/></axsl:template>

<!--PATTERN pd10134-->


	<!--RULE -->
<axsl:template match="/*" priority="1000" mode="M30"><svrl:fired-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl" context="/*"/>

		<!--ASSERT untestable-->
<axsl:choose><axsl:when test="true()"/><axsl:otherwise><svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" test="true()"><axsl:attribute name="id">pd10134</axsl:attribute><axsl:attribute name="role">untestable</axsl:attribute><axsl:attribute name="location"><axsl:apply-templates select="." mode="schematron-select-full-path"/></axsl:attribute><svrl:text>If more than one set of stoichiometries can be applied to the flux arcs of the process then the stoichiometry of the flux arcs must be displayed.</svrl:text></svrl:failed-assert></axsl:otherwise></axsl:choose>

		<!--ASSERT unimplemented-->
<axsl:choose><axsl:when test="true()"/><axsl:otherwise><svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" test="true()"><axsl:attribute name="id">pd10135</axsl:attribute><axsl:attribute name="role">unimplemented</axsl:attribute><axsl:attribute name="location"><axsl:apply-templates select="." mode="schematron-select-full-path"/></axsl:attribute><svrl:text>If the stoichiometry is undefined or unknown this should be indicated by the use of a question mark ("?").</svrl:text></svrl:failed-assert></axsl:otherwise></axsl:choose><axsl:apply-templates select="*" mode="M30"/></axsl:template><axsl:template match="text()" priority="-1" mode="M30"/><axsl:template match="@*|node()" priority="-2" mode="M30"><axsl:apply-templates select="*" mode="M30"/></axsl:template>

<!--PATTERN pd10140-->


	<!--RULE -->
<axsl:template match="sbgn:glyph" priority="1000" mode="M31"><svrl:fired-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl" context="sbgn:glyph"/><axsl:variable name="id" select="@id"/><axsl:variable name="class" select="@class"/>

		<!--ASSERT error-->
<axsl:choose><axsl:when test="not($class='biological activity' or      $class='outcome' or      $class='variable value' or      $class='entity')"/><axsl:otherwise><svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" test="not($class='biological activity' or $class='outcome' or $class='variable value' or $class='entity')"><axsl:attribute name="id">pd10140</axsl:attribute><axsl:attribute name="role">error</axsl:attribute><axsl:attribute name="location"><axsl:apply-templates select="." mode="schematron-select-full-path"/></axsl:attribute><svrl:text>This 'glyph class' is not allowed in Process Description
			</svrl:text> <svrl:diagnostic-reference diagnostic="id">
<axsl:text/><axsl:value-of select="$id"/><axsl:text/></svrl:diagnostic-reference> <svrl:diagnostic-reference diagnostic="class">
<axsl:text/><axsl:value-of select="$class"/><axsl:text/></svrl:diagnostic-reference></svrl:failed-assert></axsl:otherwise></axsl:choose><axsl:apply-templates select="*" mode="M31"/></axsl:template><axsl:template match="text()" priority="-1" mode="M31"/><axsl:template match="@*|node()" priority="-2" mode="M31"><axsl:apply-templates select="*" mode="M31"/></axsl:template>

<!--PATTERN pd10141-->


	<!--RULE -->
<axsl:template match="sbgn:glyph[@class='process']" priority="1000" mode="M32"><svrl:fired-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl" context="sbgn:glyph[@class='process']"/><axsl:variable name="id" select="@id"/><axsl:variable name="port-id" select="./sbgn:port/@id"/><axsl:variable name="count" select="count(//sbgn:arc[(./@target = current()/sbgn:port/@id) or (./@source = current()/sbgn:port/@id)])"/>

		<!--ASSERT error-->
<axsl:choose><axsl:when test="($count &gt;= 2)"/><axsl:otherwise><svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" test="($count &gt;= 2)"><axsl:attribute name="id">pd10141</axsl:attribute><axsl:attribute name="role">error</axsl:attribute><axsl:attribute name="location"><axsl:apply-templates select="." mode="schematron-select-full-path"/></axsl:attribute><svrl:text>All process nodes should have at least one input and at least one ouput pointing to the arcs 
			</svrl:text> <svrl:diagnostic-reference diagnostic="id">
<axsl:text/><axsl:value-of select="$id"/><axsl:text/></svrl:diagnostic-reference> <svrl:diagnostic-reference diagnostic="count">
<axsl:text/><axsl:value-of select="$count"/><axsl:text/></svrl:diagnostic-reference></svrl:failed-assert></axsl:otherwise></axsl:choose><axsl:apply-templates select="*" mode="M32"/></axsl:template><axsl:template match="text()" priority="-1" mode="M32"/><axsl:template match="@*|node()" priority="-2" mode="M32"><axsl:apply-templates select="*" mode="M32"/></axsl:template>

<!--PATTERN pd10142-->


	<!--RULE -->
<axsl:template match="sbgn:arc[@class='logic arc']" priority="1000" mode="M33"><svrl:fired-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl" context="sbgn:arc[@class='logic arc']"/><axsl:variable name="id" select="@id"/><axsl:variable name="source" select="@source"/><axsl:variable name="target" select="@target"/><axsl:variable name="port-class" select="//sbgn:port[@id=$source or @id=$target]/../@class"/>

		<!--ASSERT error-->
<axsl:choose><axsl:when test="     $port-class='and' or      $port-class='or' or     $port-class='not'"/><axsl:otherwise><svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" test="$port-class='and' or $port-class='or' or $port-class='not'"><axsl:attribute name="id">pd10142</axsl:attribute><axsl:attribute name="role">error</axsl:attribute><axsl:attribute name="location"><axsl:apply-templates select="." mode="schematron-select-full-path"/></axsl:attribute><svrl:text>logic Arc must be connected to either 'OR', 'AND' or 'NOT'
			</svrl:text> <svrl:diagnostic-reference diagnostic="id">
<axsl:text/><axsl:value-of select="$id"/><axsl:text/></svrl:diagnostic-reference> <svrl:diagnostic-reference diagnostic="source">
<axsl:text/><axsl:value-of select="$source"/><axsl:text/></svrl:diagnostic-reference> <svrl:diagnostic-reference diagnostic="port-class">
<axsl:text/><axsl:value-of select="$port-class"/><axsl:text/></svrl:diagnostic-reference> <svrl:diagnostic-reference diagnostic="target">
<axsl:text/><axsl:value-of select="$target"/><axsl:text/></svrl:diagnostic-reference></svrl:failed-assert></axsl:otherwise></axsl:choose><axsl:apply-templates select="*" mode="M33"/></axsl:template><axsl:template match="text()" priority="-1" mode="M33"/><axsl:template match="@*|node()" priority="-2" mode="M33"><axsl:apply-templates select="*" mode="M33"/></axsl:template></axsl:stylesheet>



