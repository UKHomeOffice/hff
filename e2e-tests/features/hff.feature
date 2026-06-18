@HffRegression
@RegressionTestCI
Feature: HFF - HOF Feedback Form

  Scenario Outline: HOF Feedback Form E2E test
    Given I visit the feedback page
    When I choose to select "<Option>" on the feedback page
    And I enter "<Text>" in the How could we improve this form field
    And I choose to send feedback
    Then I should see the "Feedback sent" page
    And "Return to the GOV.UK homepage" link is displayed

    Examples:
      | Option                            | Text        |
      | Very satisfied                    | Satisfied   |
      | Satisfied                         | Test 1234   |
      | Neither satisfied or dissatisfied | Satisfied   |
      | Dissatisfied                      | Ban service |
      | Very dissatisfied                 |             |
      |                                   |             |
      |                                   | Ban service |
