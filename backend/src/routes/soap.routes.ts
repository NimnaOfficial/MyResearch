import express, { Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { securityManager } from '../config/securityState';
import { getJwtSecret } from '../config/env';
import prisma from '../config/prisma';

const router = express.Router();

// Parse raw XML body for SOAP endpoints
router.use(express.text({ type: ['text/xml', 'application/xml', 'application/soap+xml'] }));

// ==========================================
// FORMAL WSDL 2.0 / 1.1 SERVICE DEFINITION
// ==========================================
const WSDL_XML = `<?xml version="1.0" encoding="UTF-8"?>
<definitions name="MatrixSecurityDefenseService"
  targetNamespace="http://csx.matrix.io/security/v1"
  xmlns="http://schemas.xmlsoap.org/wsdl/"
  xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap12/"
  xmlns:tns="http://csx.matrix.io/security/v1"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema">

  <types>
    <xsd:schema targetNamespace="http://csx.matrix.io/security/v1">
      <xsd:element name="ExecuteSystemLockdownRequest">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="enabled" type="xsd:boolean"/>
            <xsd:element name="reason" type="xsd:string" minOccurs="0"/>
            <xsd:element name="masterToken" type="xsd:string"/>
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>

      <xsd:element name="ExecuteSystemLockdownResponse">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="statusCode" type="xsd:int"/>
            <xsd:element name="lockdownActive" type="xsd:boolean"/>
            <xsd:element name="defconStatus" type="xsd:string"/>
            <xsd:element name="timestamp" type="xsd:dateTime"/>
            <xsd:element name="digitalChecksum" type="xsd:string"/>
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>

      <xsd:element name="HoldDatabaseConnectionRequest">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="held" type="xsd:boolean"/>
            <xsd:element name="reason" type="xsd:string" minOccurs="0"/>
            <xsd:element name="masterToken" type="xsd:string"/>
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>

      <xsd:element name="HoldDatabaseConnectionResponse">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="statusCode" type="xsd:int"/>
            <xsd:element name="dbHeldActive" type="xsd:boolean"/>
            <xsd:element name="fallbackArmed" type="xsd:boolean"/>
            <xsd:element name="timestamp" type="xsd:dateTime"/>
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>

      <xsd:element name="VerifySecurityIntegrityRequest">
        <xsd:complexType><xsd:sequence/></xsd:complexType>
      </xsd:element>

      <xsd:element name="VerifySecurityIntegrityResponse">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="defconLevel" type="xsd:int"/>
            <xsd:element name="lockdownActive" type="xsd:boolean"/>
            <xsd:element name="dbHeldActive" type="xsd:boolean"/>
            <xsd:element name="activeBannedIps" type="xsd:int"/>
            <xsd:element name="signature" type="xsd:string"/>
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>
    </xsd:schema>
  </types>

  <message name="ExecuteSystemLockdownIn">
    <part name="parameters" element="tns:ExecuteSystemLockdownRequest"/>
  </message>
  <message name="ExecuteSystemLockdownOut">
    <part name="parameters" element="tns:ExecuteSystemLockdownResponse"/>
  </message>

  <message name="HoldDatabaseConnectionIn">
    <part name="parameters" element="tns:HoldDatabaseConnectionRequest"/>
  </message>
  <message name="HoldDatabaseConnectionOut">
    <part name="parameters" element="tns:HoldDatabaseConnectionResponse"/>
  </message>

  <message name="VerifySecurityIntegrityIn">
    <part name="parameters" element="tns:VerifySecurityIntegrityRequest"/>
  </message>
  <message name="VerifySecurityIntegrityOut">
    <part name="parameters" element="tns:VerifySecurityIntegrityResponse"/>
  </message>

  <portType name="MatrixSecurityDefensePort">
    <operation name="ExecuteSystemLockdown">
      <input message="tns:ExecuteSystemLockdownIn"/>
      <output message="tns:ExecuteSystemLockdownOut"/>
    </operation>
    <operation name="HoldDatabaseConnection">
      <input message="tns:HoldDatabaseConnectionIn"/>
      <output message="tns:HoldDatabaseConnectionOut"/>
    </operation>
    <operation name="VerifySecurityIntegrity">
      <input message="tns:VerifySecurityIntegrityIn"/>
      <output message="tns:VerifySecurityIntegrityOut"/>
    </operation>
  </portType>

  <binding name="MatrixSecurityDefenseBinding" type="tns:MatrixSecurityDefensePort">
    <soap:binding transport="http://schemas.xmlsoap.org/soap/http" style="document"/>
    <operation name="ExecuteSystemLockdown">
      <soap:operation soapAction="http://csx.matrix.io/security/v1/ExecuteSystemLockdown"/>
      <input><soap:body use="literal"/></input>
      <output><soap:body use="literal"/></output>
    </operation>
    <operation name="HoldDatabaseConnection">
      <soap:operation soapAction="http://csx.matrix.io/security/v1/HoldDatabaseConnection"/>
      <input><soap:body use="literal"/></input>
      <output><soap:body use="literal"/></output>
    </operation>
    <operation name="VerifySecurityIntegrity">
      <soap:operation soapAction="http://csx.matrix.io/security/v1/VerifySecurityIntegrity"/>
      <input><soap:body use="literal"/></input>
      <output><soap:body use="literal"/></output>
    </operation>
  </binding>

  <service name="MatrixSecurityDefenseService">
    <port name="MatrixSecurityDefensePort" binding="tns:MatrixSecurityDefenseBinding">
      <soap:address location="http://localhost:5000/api/soap/security"/>
    </port>
  </service>
</definitions>`;

// Return WSDL schema on GET ?wsdl
router.get('/', (req: Request, res: Response) => {
  if (req.query.wsdl !== undefined || req.url.includes('wsdl')) {
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(WSDL_XML);
  }
  res.setHeader('Content-Type', 'text/xml');
  res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><serviceInfo>Matrix SOAP 1.2 Enterprise Endpoint Active. Append ?wsdl for definition.</serviceInfo>`);
});

// Process SOAP 1.2 XML Envelopes
router.post('/', async (req: Request, res: Response) => {
  const xmlBody = typeof req.body === 'string' ? req.body : '';
  const now = new Date().toISOString();
  res.setHeader('Content-Type', 'application/soap+xml; charset=utf-8');

  // Verify XML Envelope structure
  if (!xmlBody.includes('Envelope') || !xmlBody.includes('Body')) {
    return res.status(500).send(`<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://www.w3.org/2003/05/soap-envelope">
  <soapenv:Body>
    <soapenv:Fault>
      <soapenv:Code><soapenv:Value>soapenv:Sender</soapenv:Value></soapenv:Code>
      <soapenv:Reason><soapenv:Text xml:lang="en">Malformed XML SOAP Envelope Payload.</soapenv:Text></soapenv:Reason>
    </soapenv:Fault>
  </soapenv:Body>
</soapenv:Envelope>`);
  }

  // Helper to extract XML tag value
  const extractTag = (tag: string): string => {
    const match = xmlBody.match(new RegExp(`<([a-zA-Z0-9_]+:)?${tag}[^>]*>([^<]*)<\\/([a-zA-Z0-9_]+:)?${tag}>`, 'i'));
    return match ? match[2].trim() : '';
  };

  // 1. OPERATION: VerifySecurityIntegrity
  if (xmlBody.includes('VerifySecurityIntegrity')) {
    const state = securityManager.getState();
    const defcon = state.lockdownEnabled ? 1 : state.dbConnectionHeld ? 2 : 5;
    const rawToSign = `${defcon}-${state.lockdownEnabled}-${state.dbConnectionHeld}-${now}`;
    const hash = crypto.createHash('sha256').update(rawToSign).digest('hex');

    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://www.w3.org/2003/05/soap-envelope" xmlns:sec="http://csx.matrix.io/security/v1">
  <soapenv:Header>
    <sec:WS-SecurityTimestamp>${now}</sec:WS-SecurityTimestamp>
  </soapenv:Header>
  <soapenv:Body>
    <sec:VerifySecurityIntegrityResponse>
      <sec:defconLevel>${defcon}</sec:defconLevel>
      <sec:lockdownActive>${state.lockdownEnabled}</sec:lockdownActive>
      <sec:dbHeldActive>${state.dbConnectionHeld}</sec:dbHeldActive>
      <sec:activeBannedIps>${state.blacklistedIps.length}</sec:activeBannedIps>
      <sec:signature>${hash}</sec:signature>
    </sec:VerifySecurityIntegrityResponse>
  </soapenv:Body>
</soapenv:Envelope>`);
  }

  // 2. OPERATION: ExecuteSystemLockdown
  if (xmlBody.includes('ExecuteSystemLockdown')) {
    const enabledStr = extractTag('enabled').toLowerCase();
    const enabled = enabledStr === 'true' || enabledStr === '1';
    const reason = extractTag('reason') || 'SOAP Enterprise Contract Directive';

    const active = securityManager.setLockdown(enabled, 'SOAP Master Gateway');
    const checksum = crypto.createHash('sha256').update(`LOCKDOWN-${active}-${now}`).digest('hex');

    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://www.w3.org/2003/05/soap-envelope" xmlns:sec="http://csx.matrix.io/security/v1">
  <soapenv:Header>
    <sec:AuditTransactionId>SOAP-TX-${Date.now()}</sec:AuditTransactionId>
  </soapenv:Header>
  <soapenv:Body>
    <sec:ExecuteSystemLockdownResponse>
      <sec:statusCode>200</sec:statusCode>
      <sec:lockdownActive>${active}</sec:lockdownActive>
      <sec:defconStatus>${active ? 'DEFCON 1' : 'DEFCON 5'}</sec:defconStatus>
      <sec:timestamp>${now}</sec:timestamp>
      <sec:digitalChecksum>${checksum}</sec:digitalChecksum>
    </sec:ExecuteSystemLockdownResponse>
  </soapenv:Body>
</soapenv:Envelope>`);
  }

  // 3. OPERATION: HoldDatabaseConnection
  if (xmlBody.includes('HoldDatabaseConnection')) {
    const heldStr = extractTag('held').toLowerCase();
    const held = heldStr === 'true' || heldStr === '1';
    const reason = extractTag('reason') || 'SOAP Database Isolation Directive';

    const active = securityManager.setDbConnectionHeld(held, 'SOAP Master Gateway');

    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://www.w3.org/2003/05/soap-envelope" xmlns:sec="http://csx.matrix.io/security/v1">
  <soapenv:Header>
    <sec:AuditTransactionId>SOAP-DB-${Date.now()}</sec:AuditTransactionId>
  </soapenv:Header>
  <soapenv:Body>
    <sec:HoldDatabaseConnectionResponse>
      <sec:statusCode>200</sec:statusCode>
      <sec:dbHeldActive>${active}</sec:dbHeldActive>
      <sec:fallbackArmed>true</sec:fallbackArmed>
      <sec:timestamp>${now}</sec:timestamp>
    </sec:HoldDatabaseConnectionResponse>
  </soapenv:Body>
</soapenv:Envelope>`);
  }

  // 4. OPERATION: VerifySecurityToken
  if (xmlBody.includes('VerifySecurityToken')) {
    const token = extractTag('token');
    if (!token) {
      return res.status(400).send(`<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://www.w3.org/2003/05/soap-envelope" xmlns:sec="http://csx.matrix.io/security/v1">
  <soapenv:Body>
    <sec:VerifySecurityTokenResponse>
      <sec:status>ERROR</sec:status>
      <sec:statusCode>400</sec:statusCode>
      <sec:message>Missing verification token in SOAP envelope.</sec:message>
      <sec:timestamp>${now}</sec:timestamp>
    </sec:VerifySecurityTokenResponse>
  </soapenv:Body>
</soapenv:Envelope>`);
    }

    try {
      const decoded = jwt.verify(token, getJwtSecret()) as jwt.JwtPayload;
      if (decoded.purpose !== 'verify' || !decoded.id) {
        throw new Error('Not a valid verification token');
      }

      const userId = decoded.id as string;
      if (!securityManager.getState().dbConnectionHeld) {
        await prisma.user.update({
          where: { id: userId },
          data: { isVerified: true },
        });
      }

      const hash = crypto.createHash('sha256').update(`VERIFY-OK-${userId}-${now}`).digest('hex');

      return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://www.w3.org/2003/05/soap-envelope" xmlns:sec="http://csx.matrix.io/security/v1">
  <soapenv:Header>
    <sec:WS-SecurityTimestamp>${now}</sec:WS-SecurityTimestamp>
    <sec:AuditStamp>${hash}</sec:AuditStamp>
  </soapenv:Header>
  <soapenv:Body>
    <sec:VerifySecurityTokenResponse>
      <sec:status>SUCCESS</sec:status>
      <sec:statusCode>200</sec:statusCode>
      <sec:message>Cryptographic Identity Token Verified Successfully.</sec:message>
      <sec:userId>${userId}</sec:userId>
      <sec:timestamp>${now}</sec:timestamp>
      <sec:digitalSignature>${hash}</sec:digitalSignature>
    </sec:VerifySecurityTokenResponse>
  </soapenv:Body>
</soapenv:Envelope>`);
    } catch (err: any) {
      return res.status(400).send(`<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://www.w3.org/2003/05/soap-envelope" xmlns:sec="http://csx.matrix.io/security/v1">
  <soapenv:Body>
    <sec:VerifySecurityTokenResponse>
      <sec:status>INVALID</sec:status>
      <sec:statusCode>400</sec:statusCode>
      <sec:message>Security token rejected or expired.</sec:message>
      <sec:timestamp>${now}</sec:timestamp>
    </sec:VerifySecurityTokenResponse>
  </soapenv:Body>
</soapenv:Envelope>`);
    }
  }

  // Default SOAP Fault
  return res.status(500).send(`<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://www.w3.org/2003/05/soap-envelope">
  <soapenv:Body>
    <soapenv:Fault>
      <soapenv:Code><soapenv:Value>soapenv:Receiver</soapenv:Value></soapenv:Code>
      <soapenv:Reason><soapenv:Text xml:lang="en">Unknown SOAP Operation Requested.</soapenv:Text></soapenv:Reason>
    </soapenv:Fault>
  </soapenv:Body>
</soapenv:Envelope>`);
});

export default router;
