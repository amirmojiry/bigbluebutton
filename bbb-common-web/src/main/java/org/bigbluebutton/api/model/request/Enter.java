package org.bigbluebutton.api.model.request;

import jakarta.ws.rs.core.MediaType;
import org.bigbluebutton.api.model.constraint.*;
import org.bigbluebutton.api.service.SessionService;

import javax.servlet.http.HttpServletRequest;
import javax.validation.constraints.NotNull;
import java.util.Map;
import java.util.Set;

@ContentTypeConstraint
public class Enter extends RequestWithSession<Enter.Params>{

    public enum Params implements RequestParameters {
        SESSION_TOKEN("sessionToken");

        private final String value;

        Params(String value) { this.value = value; }

        public String getValue() { return value; }
    }

    @UserSessionConstraint
    @GuestPolicyConstraint
    private String sessionToken;

    @MeetingExistsConstraint
    @MeetingEndedConstraint
    private String meetingID;

    private SessionService sessionService;

    public Enter(HttpServletRequest servletRequest) {
        super(servletRequest);
        sessionService = new SessionService();
    }

    public String getSessionToken() {
        return sessionToken;
    }

    public void setSessionToken(String sessionToken) {
        this.sessionToken = sessionToken;
    }

    @Override
    public void populateFromParamsMap(Map<String, String[]> params) {
        if(params.containsKey(Params.SESSION_TOKEN.getValue())) {
            setSessionToken(params.get(Params.SESSION_TOKEN.getValue())[0]);
            sessionService.setSessionToken(sessionToken);
            meetingID = sessionService.getMeetingID();
        }
    }

    @Override
    public void convertParamsFromString() {

    }
}
