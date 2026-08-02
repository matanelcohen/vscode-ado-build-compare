import * as React from "react";
import {
  Badge,
  Body1,
  Caption1,
  Card,
  makeStyles,
  shorthands,
  Title3,
  tokens,
} from "@fluentui/react-components";
import { buildPageRedesignIdeas } from "../../models/buildPageRedesignIdeas";

const useStyles = makeStyles({
  section: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: tokens.spacingHorizontalM,
  },
  card: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalL),
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalS,
  },
  list: {
    margin: 0,
    paddingLeft: "18px",
    color: tokens.colorNeutralForeground2,
  },
  layout: {
    color: tokens.colorNeutralForeground3,
  },
});

export const BuildPageRedesignIdeas: React.FC = () => {
  const styles = useStyles();

  return (
    <section className={styles.section} aria-labelledby="build-page-redesign">
      <div>
        <Title3 id="build-page-redesign">Build page redesign mockups</Title3>
        <Body1>
          Three lightweight directions to review before committing to a larger
          UI refresh.
        </Body1>
      </div>
      <div className={styles.grid}>
        {buildPageRedesignIdeas.map((idea) => (
          <Card className={styles.card} key={idea.id}>
            <div className={styles.header}>
              <Title3>{idea.title}</Title3>
              {idea.recommended && <Badge appearance="filled">Recommended</Badge>}
            </div>
            <Body1>{idea.summary}</Body1>
            <Caption1 className={styles.layout}>Mockup: {idea.layout}</Caption1>
            <ul className={styles.list}>
              {idea.highlights.map((highlight) => (
                <li key={highlight}>
                  <Caption1>{highlight}</Caption1>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </section>
  );
};
