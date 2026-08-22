import type { ReactNode } from "react";
import { Alert, Content, Flex, Title } from "@patternfly/react-core";
import InfoCircleIcon from "@patternfly/react-icons/dist/esm/icons/info-circle-icon";
import ExternalLinkAltIcon from "@patternfly/react-icons/dist/esm/icons/external-link-alt-icon";
import { css } from "@patternfly/react-styles";
import textStyles from "@patternfly/react-styles/css/utilities/Text/text.mjs";
import { Sparkles } from "@/lib/pfIcons";

export const LIGHTSPEED_AI_RESPONSE_FOOTER =
  "Always review AI generated content prior to use.";

export const OLS_WELCOME_HEADLINE =
  "Explore deeper insights, engage in meaningful discussions, and unlock new possibilities with Red Hat OpenShift Lightspeed.";

export const OLS_WELCOME_CAUTION =
  "Answers are provided by generative AI technology, please use appropriate caution when following recommendations.";

export const OLS_IMPORTANT_BODY =
  "OpenShift Lightspeed uses AI technology to help answer your questions. Do not include personal information or other sensitive information in your input. Interactions may be used to improve Red Hat's products or services.";

export const OLS_WELCOME_ALERT_TITLE = "Welcome to OpenShift Lightspeed!";

export const OLS_WELCOME_ALERT_BODY =
  "OpenShift Lightspeed is now available to help you with your OpenShift questions and tasks. Try asking about deployments, troubleshooting, best practices, or any other OpenShift-related topics. This notice will disappear once you minimize the chat.";

export const OLS_FEEDBACK_PREFIX = "For questions or feedback about OpenShift Lightspeed, ";
export const OLS_FEEDBACK_LINK_LABEL = "email the Red Hat team";
export const OLS_FEEDBACK_HREF = "mailto:openshift-lightspeed@redhat.com";

/** Agentic run details — autonomous Lightspeed features (JuLim implemented copy). */
export const LIGHTSPEED_AUTONOMOUS_FEATURES_DISCLAIMER =
  "The autonomous features of OpenShift Lightspeed use AI technology to generate output. Always review AI-generated content prior to use.";

/** PM / legal — AI privacy notice for cluster update AI surfaces (exact approved copy). */
export const CLUSTER_UPDATE_AI_IMPORTANT_TITLE = "Important";

export const CLUSTER_UPDATE_AI_PRIVACY_BODY =
  "This feature uses AI technology. Do not include any personal information or other sensitive information in your input. Interactions may be used to improve Red Hat's products or services.";

export const CLUSTER_UPDATE_AI_PRIVACY_FOOTER_PREFIX =
  "For more information about Red Hat's privacy practices, please refer to the ";

export const CLUSTER_UPDATE_AI_PRIVACY_LINK_LABEL = "Red Hat Privacy Statement";

export const CLUSTER_UPDATE_AI_PRIVACY_LINK_HREF = "https://www.redhat.com/en/about/privacy-policy";

/** Section heading for the agent proposed plan (use spaces, not a hyphen, per product copy). */
export const AI_GENERATED_PLAN_HEADING = "AI generated plan";

/** Shared body (paragraphs + link) for banner and agent logs panel. */
export function ClusterUpdateAiPrivacyDisclaimerBody() {
  return (
    <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
      <Content component="p" style={{ margin: 0 }}>
        {CLUSTER_UPDATE_AI_PRIVACY_BODY}
      </Content>
      <Content component="p" style={{ margin: 0 }}>
        {CLUSTER_UPDATE_AI_PRIVACY_FOOTER_PREFIX}
        <a href={CLUSTER_UPDATE_AI_PRIVACY_LINK_HREF} target="_blank" rel="noopener noreferrer">
          {CLUSTER_UPDATE_AI_PRIVACY_LINK_LABEL}
        </a>
        .
      </Content>
    </Flex>
  );
}

/** Non-dismissible banner for Cluster Update (Update plan tab — shown for manual and agent-based flows). Uses PatternFly custom alert styling. */
export function ClusterUpdateAiImportantPrivacyBanner() {
  return (
    <Alert
      variant="custom"
      className="ocs-cluster-update-ai-privacy-alert"
      customIcon={<Sparkles aria-hidden />}
      title={CLUSTER_UPDATE_AI_IMPORTANT_TITLE}
    >
      <ClusterUpdateAiPrivacyDisclaimerBody />
    </Alert>
  );
}

/** Same disclaimer as {@link ClusterUpdateAiImportantPrivacyBanner}, for agent logs panel chrome. */
export function ClusterUpdateAiImportantPrivacyPanelNotice() {
  return (
    <Alert
      variant="custom"
      className="ocs-cluster-update-ai-privacy-alert"
      customIcon={<Sparkles aria-hidden />}
      title={CLUSTER_UPDATE_AI_IMPORTANT_TITLE}
    >
      <ClusterUpdateAiPrivacyDisclaimerBody />
    </Alert>
  );
}

export function LightspeedWelcomeNotice() {
  return (
    <Alert
      isInline
      variant="custom"
      customIcon={<InfoCircleIcon />}
      title={OLS_WELCOME_ALERT_TITLE}
      className="ols-panel-alert ols-welcome-alert"
    >
      {OLS_WELCOME_ALERT_BODY}
    </Alert>
  );
}

export function LightspeedHeaderNotice() {
  return (
    <Alert
      isInline
      variant="custom"
      customIcon={<InfoCircleIcon />}
      title="Important"
      className="ols-panel-alert ols-important-alert"
    >
      {OLS_IMPORTANT_BODY}
    </Alert>
  );
}

export function LightspeedComposerFooter() {
  return (
    <div className="ols-panel-legal">
      <p>{LIGHTSPEED_AI_RESPONSE_FOOTER}</p>
      <p>
        {OLS_FEEDBACK_PREFIX}
        <a href={OLS_FEEDBACK_HREF} className="ols-panel-legal__link">
          {OLS_FEEDBACK_LINK_LABEL}
          <ExternalLinkAltIcon className="ols-panel-legal__ext" />
        </a>
      </p>
    </div>
  );
}

export function LightspeedAiMessageFooter() {
  return (
    <p
      className="ols-legal-message-footer"
      style={{
        margin: "0.5rem 0 0 0",
        fontSize: "var(--pf-t--global--font--size--body--sm, 0.75rem)",
        lineHeight: 1.4,
        color: "var(--pf-t--global--text--color--subtle)",
      }}
    >
      {LIGHTSPEED_AI_RESPONSE_FOOTER}
    </p>
  );
}

/** Inline PatternFly alert for AI generated plan / assessment surfaces (uses approved accuracy copy). */
export function LightspeedAiContentBanner() {
  return (
    <Alert variant="info" isInline title="AI generated content">
      <Content component="p" style={{ margin: 0 }}>
        {LIGHTSPEED_AI_RESPONSE_FOOTER}
      </Content>
    </Alert>
  );
}

/**
 * Design language — AI-enabled features: sparkles icon immediately left of the label (see PM guideline slides).
 * Use anywhere AI generated or AI-assisted output is introduced (plans, logs, assessment).
 */
export function AiSparkleLabel({
  children,
  className,
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <Flex
      alignItems={{ default: "alignItemsCenter" }}
      gap={{ default: "gapSm" }}
      className={className ? `ocs-ai-sparkle-label ${className}` : "ocs-ai-sparkle-label"}
      role="group"
      aria-label={ariaLabel}
    >
      <Sparkles aria-hidden className="ocs-ai-sparkle-label__icon shrink-0" />
      <span className={`ocs-ai-sparkle-label__text ${css(textStyles.fontWeightBold)}`}>{children}</span>
    </Flex>
  );
}

/** Agent proposed-plan section — same heading scale as “AI Update Agent” + leading sparkle. */
export function AiGeneratedPlanMarker({ className }: { className?: string }) {
  return (
    <Flex
      alignItems={{ default: "alignItemsCenter" }}
      gap={{ default: "gapSm" }}
      className={className ? `ocs-ai-plan-marker ${className}` : "ocs-ai-plan-marker"}
      role="group"
      aria-label={AI_GENERATED_PLAN_HEADING}
    >
      <Sparkles aria-hidden className="ocs-ai-plan-marker__icon" />
      <Title headingLevel="h2" size="xl" style={{ margin: 0, hyphens: "none" }}>
        {AI_GENERATED_PLAN_HEADING}
      </Title>
    </Flex>
  );
}

/** Agent execution log drawer heading — sparkles + “AI agent logs”. */
export function AiAgentLogsHeading({ className }: { className?: string }) {
  return (
    <AiSparkleLabel className={className} aria-label="AI agent logs">
      AI agent logs
    </AiSparkleLabel>
  );
}

/** Subtle inline disclaimer for dense layouts (e.g. next to metrics). */
export function LightspeedAiAccuracyInline({ className }: { className?: string }) {
  return (
    <p
      className={className}
      style={{
        margin: 0,
        fontSize: "var(--pf-t--global--font--size--body--sm, 0.75rem)",
        lineHeight: 1.4,
        color: "var(--pf-t--global--text--color--subtle)",
      }}
    >
      {LIGHTSPEED_AI_RESPONSE_FOOTER}
    </p>
  );
}
