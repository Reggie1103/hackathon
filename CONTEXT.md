# Sovereign Customer Support

This context describes a bilingual customer-support conversation assisted by private company knowledge while a human agent remains responsible for the response.

## People and conversation

**Customer**:
A person contacting the company to ask a question or resolve a service problem.
_Avoid_: User, caller, consumer

**Agent**:
The human company representative who reviews evidence and decides what to communicate to the customer.
_Avoid_: Operator, advisor, AI agent

**Call Session**:
One customer-support interaction from the moment assistance begins until its retention policy is applied.
_Avoid_: Chat, record, ticket

**Utterance**:
A stable turn of speech attributed to either the Customer or the Agent.
_Avoid_: Message, audio chunk, sentence

## Company knowledge

**Knowledge Document**:
An approved company source with an identifiable version and period of validity.
_Avoid_: File, manual, PDF

**Evidence**:
A specific passage from a valid Knowledge Document that supports operational guidance.
_Avoid_: Context, search result, reference

**Knowledge Gap**:
A customer need for which the valid Knowledge Documents contain no sufficient Evidence.
_Avoid_: Hallucination, failed search, unknown intent

## Assistance and safeguards

**Supported Guidance**:
A short proposed response or action whose claims are traceable to Evidence and which requires Agent review.
_Avoid_: Answer, solution, recommendation

**Evidence Gate**:
The product rule that prevents unsupported guidance from being presented as company-approved information.
_Avoid_: Confidence threshold, fact checker

**Critical Entity**:
A detail whose meaning must be preserved exactly across transcription and translation, such as a code, number, date, amount or negation.
_Avoid_: Keyword, token, named entity

**Critical Data Lock**:
The product safeguard that blocks communication when a Critical Entity is missing, changed or unresolved.
_Avoid_: Validator, spell check, guardrail

**Bilingual Bridge**:
The bidirectional conversation flow that lets a Customer and Agent communicate while using different languages.
_Avoid_: Translator, language mode

**Abstention**:
An explicit outcome stating that the system cannot provide Supported Guidance with the available Evidence.
_Avoid_: Error, failure, no response

