module.exports = (req, res, next) => {
    if (req.user && req.user.emailVerificationToken) {
        res.locals.isEmailVerified = false;
        req.flash('info', 
            `Your email is not yet verified, please check your mailbox and click the verification link inside to activate your account<br/>
            If email is not found, click
            <form class="m-0 p-0 d-inline" action="resend-email-verification" method="POST">
                <input type="hidden" name="_csrf" value="${res.locals.csrfToken}">
                <button class="btn btn-link p-0 m-0 align-top border-0">here</button>
            </form>`);
    } else {
        res.locals.isEmailVerified = true;
    }
    res.locals.info = req.flash('info');
    res.locals.error = req.flash('error');
    res.locals.success = req.flash('success');
    return next();
}