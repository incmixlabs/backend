import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components"
import * as React from "react"

import { contents } from "@/emails/contents"
import { config } from "@incmix/shared/env"
interface Props {
  verificationLink: string
}

const baseUrl = config.frontendUrl
const productionUrl = config.productionUrl

export function VerificationEmail({
  verificationLink = baseUrl,
}: Props): React.ReactElement<Props> {
  return (
    <React.Fragment>
      <Html>
        <Head />
        <Preview>{contents.please_verify_email}</Preview>
        <Tailwind>
          <React.Fragment>
            <Body className="bg-white py-2.5 font-sans">
              <Container className="border-[#f0f0f0] p-[45px] font-light text-[#404040] leading-[26px]">
                <Section className="mt-[32px]">
                  <Img
                    src={`${productionUrl}/static/logo.png`}
                    height="37"
                    alt={config.name}
                    className="mx-auto my-0"
                  />
                </Section>
                <Section>
                  <Text>{contents.please_verify_email}</Text>
                  <Section className="mt-8 text-center">
                    <Button
                      className="rounded bg-black px-5 py-3 text-center font-semibold text-[12px] text-white no-underline"
                      href={verificationLink}
                    >
                      {contents.verification_title}
                    </Button>
                  </Section>
                </Section>
                <Hr className="mt-[24px]" />
                <Section className="text-[#6a737d]">
                  <Text className="text-[12px] leading-[18px]">
                    {config.name}
                    <br />
                    {config.company.streetAddress}
                    <br />
                    {config.company.city}
                    <br />
                    {config.company.country}, {config.company.postcode}
                  </Text>
                </Section>
              </Container>
            </Body>
          </React.Fragment>
        </Tailwind>
      </Html>
    </React.Fragment>
  )
}

export default VerificationEmail
