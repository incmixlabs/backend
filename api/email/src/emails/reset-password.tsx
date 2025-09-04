import { config } from "@incmix/utils/env"
import { contents } from "@/emails/contents"
import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "./react-email-import"

interface Props {
  username?: string
  resetPasswordLink?: string
}

const productionUrl = config.productionUrl

export const ResetPasswordEmail = ({ username, resetPasswordLink }: Props) => {
  username = username || "unknown_name"

  return (
    <Html>
      <Head />
      <Preview>{contents.reset_password_preview_text}</Preview>
      <Tailwind>
        <Body className="bg-white py-2.5 font-sans">
          <Container className="border-[#f0f0f0] p-[45px] font-light text-[#404040] leading-[26px]">
            <Section className="mt-[32px]">
              <Img
                src={`${productionUrl}/static/logo/logo.png`}
                height="37"
                alt={config.name}
                className="mx-auto my-0"
              />
            </Section>
            <Section>
              <Text>
                {contents.hi} {username},
              </Text>
              <Text>{contents.reset_password_text_1}</Text>
              <Button
                className="rounded bg-black px-5 py-3 text-center font-semibold text-[12px] text-white no-underline"
                href={resetPasswordLink}
              >
                {contents.reset_password}
              </Button>
              <Text>
                {contents.reset_password_text_2}{" "}
                <Link href={resetPasswordLink}>{resetPasswordLink}</Link>
              </Text>
              <Text>{contents.reset_password_text_3}</Text>
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
  )
}

export default ResetPasswordEmail
