import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Row,
  Section,
  Tailwind,
  Text,
} from "@react-email/components"
import * as React from "react"

import { contents } from "@/emails/contents"
import { config } from "@incmix/utils/env"

interface Props {
  username?: string
  userImage?: string
  orgName?: string
  orgImage?: string
  inviteUrl?: string
  invitedBy?: string | null
  type?: "system" | "organization"
  replyTo?: string
}

const baseUrl = config.frontendUrl
const productionUrl = config.productionUrl

export const InviteEmail = ({
  username,
  userImage = `${productionUrl}/static/user.png`,
  orgName,
  orgImage = `${productionUrl}/static/org.png`,
  inviteUrl = baseUrl,
  type = "organization",
  replyTo = config.notificationsEmail,
}: Props) => {
  username = username || "Unknown name"
  orgName = orgName || "Unknown organization"

  return (
    <React.Fragment>
      <Html>
        <Head />
        {/* <Preview>
          {type === "system"
            ? "Invite Prevew"
            : i18n.t("backend:email.invite_in_organization_preview_text", {
                orgName,
              })}
        </Preview> */}
        <Tailwind>
          <Body className="m-auto bg-white font-sans">
            <Container className="mx-auto my-[40px] w-[465px] rounded border border-[#eaeaea] border-solid p-[20px]">
              <Section className="mt-[32px]">
                <Img
                  src={`${productionUrl}/static/logo/logo.png`}
                  height="37"
                  alt={config.name}
                  className="mx-auto my-0"
                />
              </Section>
              <Heading className="mx-0 my-[30px] p-0 text-center font-normal text-[24px] text-black">
                <div
                  // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
                  dangerouslySetInnerHTML={{
                    __html:
                      type === "system"
                        ? contents.invite_title
                        : contents.invite_to_organization_title,
                  }}
                />
              </Heading>
              <Text className="text-[14px] text-black leading-[24px]">
                <div
                // dangerouslySetInnerHTML={{
                //   __html:
                //     type === 'system'
                //       ? (contents.invite_description, { username, invitedBy: invitedBy || i18n.t('common:unknown_inviter') }})
                //       : contents.invite_to_organization_description, {
                //           username,
                //           invitedBy: invitedBy || i18n.t('common:unknown_inviter'),
                //           orgName,
                //         },
                // }}
                />
              </Text>
              <Text className="mt-[20px] text-[#6a737d] text-[12px] leading-[18px]">
                {contents.invite_reply_to}
                <a className="ml-1" href={`mailto:${replyTo}`}>
                  {replyTo}
                </a>
              </Text>
              {/* <Text className="mt-[20px] text-[#6a737d] text-[12px] leading-[18px]">
                {i18n.t("backend:email.invite_expire")}
              </Text> */}
              <Section className="mt-[50px]">
                <Row>
                  <Column align="right">
                    <Img
                      className="rounded-full"
                      src={userImage}
                      width="64"
                      height="64"
                    />
                  </Column>
                  <Column align="center">
                    <Img
                      src={`${productionUrl}/static/arrow.png`}
                      width="12"
                      height="9"
                      alt="invited to"
                    />
                  </Column>
                  <Column align="left">
                    {type === "system" ? (
                      <Img
                        src={`${productionUrl}/static/logo/logo.png`}
                        height="37"
                        alt={config.name}
                        className="mx-auto my-0"
                      />
                    ) : (
                      <Img
                        className="rounded-full"
                        src={orgImage}
                        width="64"
                        height="64"
                      />
                    )}
                  </Column>
                </Row>
              </Section>
              <Section className="my-[32px] text-center">
                <Button
                  className="rounded bg-black px-5 py-3 text-center font-semibold text-[12px] text-white no-underline"
                  href={inviteUrl}
                >
                  {contents.accept}
                </Button>
              </Section>
              <Hr />
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
        </Tailwind>
      </Html>
    </React.Fragment>
  )
}

export default InviteEmail
